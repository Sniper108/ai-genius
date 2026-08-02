"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ClaudeStreamEvent } from "./types";
import { clearHistory, readHistory, useAutoSave } from "./useChatHistory";
import { saveToVault } from "./vault";

export interface ClaudeMessage {
  id: string;
  role: "user" | "assistant";
  /** Ordered content blocks so tool calls interleave with text. */
  blocks: Block[];
  /** Populated on the assistant turn when the CLI reports final metrics. */
  meta?: { costUsd?: number; durationMs?: number; numTurns?: number };
  streaming?: boolean;
  error?: boolean;
}

export type Block =
  | { type: "text"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_use"; name: string; input: unknown; id: string }
  | { type: "tool_result"; text: string; id?: string; isError?: boolean };

interface SendOptions {
  model?: string;
  yolo?: boolean;
  cwd?: string;
}

let uid = 0;
const nextId = () => `m${Date.now()}_${uid++}`;

export function useClaudeStream(storageKey?: string, agentName = "Claude") {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Restore persisted history once, on mount.
  useEffect(() => {
    const h = readHistory<{ messages: ClaudeMessage[]; sessionId?: string }>(storageKey);
    if (h?.messages?.length) {
      const restored = h.messages
        .map((m) => ({ ...m, streaming: false }))
        .filter((m) => m.role === "user" || m.blocks.length > 0);
      setMessages(restored);
      if (h.sessionId) setSessionId(h.sessionId);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useAutoSave(storageKey, { messages, sessionId }, loaded);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(undefined);
    setBusy(false);
    clearHistory(storageKey);
  }, [storageKey]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  }, []);

  const send = useCallback(
    async (prompt: string, opts: SendOptions = {}) => {
      if (!prompt.trim() || busy) return;

      const userMsg: ClaudeMessage = {
        id: nextId(),
        role: "user",
        blocks: [{ type: "text", text: prompt }],
      };
      const assistantId = nextId();
      const assistantMsg: ClaudeMessage = {
        id: assistantId,
        role: "assistant",
        blocks: [],
        streaming: true,
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantLog = ""; // visible reply text, accumulated for the vault log

      const patch = (fn: (m: ClaudeMessage) => ClaudeMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));

      const appendText = (t: string, kind: "text" | "thinking") =>
        patch((m) => {
          const blocks = [...m.blocks];
          const last = blocks[blocks.length - 1];
          if (last && last.type === kind) {
            blocks[blocks.length - 1] = { ...last, text: last.text + t };
          } else {
            blocks.push({ type: kind, text: t });
          }
          return { ...m, blocks };
        });

      try {
        const res = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, sessionId, ...opts }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response stream");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const frames = buf.split("\n\n");
          buf = frames.pop() ?? "";

          for (const frame of frames) {
            const dataLine = frame
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const json = dataLine.slice(5).trim();
            let evt: ClaudeStreamEvent;
            try {
              evt = JSON.parse(json);
            } catch {
              continue;
            }
            handleEvent(evt);
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          patch((m) => ({
            ...m,
            error: true,
            blocks: [
              ...m.blocks,
              { type: "text", text: `\n\n⚠️ Bridge error: ${err?.message ?? err}` },
            ],
          }));
        }
      } finally {
        patch((m) => ({ ...m, streaming: false }));
        setBusy(false);
        // Auto-log the exchange to the Obsidian vault (fire-and-forget).
        if (assistantLog.trim()) {
          void saveToVault(`💬 ${agentName}`, `**You:** ${prompt}\n\n**${agentName}:** ${assistantLog.trim()}`);
        }
      }

      function handleEvent(evt: ClaudeStreamEvent) {
        switch (evt.kind) {
          case "init":
            setSessionId(evt.sessionId);
            break;
          case "text":
            assistantLog += evt.text;
            appendText(evt.text, "text");
            break;
          case "thinking":
            appendText(evt.text, "thinking");
            break;
          case "tool_use":
            patch((m) => ({
              ...m,
              blocks: [
                ...m.blocks,
                { type: "tool_use", name: evt.name, input: evt.input, id: evt.id },
              ],
            }));
            break;
          case "tool_result":
            patch((m) => ({
              ...m,
              blocks: [
                ...m.blocks,
                { type: "tool_result", text: evt.text, id: evt.id, isError: evt.isError },
              ],
            }));
            break;
          case "result":
            if (evt.sessionId) setSessionId(evt.sessionId);
            if (!assistantLog.trim() && evt.text) assistantLog = evt.text;
            patch((m) => ({
              ...m,
              meta: {
                costUsd: evt.costUsd,
                durationMs: evt.durationMs,
                numTurns: evt.numTurns,
              },
              error: m.error || evt.isError,
              // If no text streamed (e.g. text-only result), surface it.
              blocks:
                m.blocks.length === 0 && evt.text
                  ? [{ type: "text", text: evt.text }]
                  : m.blocks,
            }));
            break;
          case "error":
            patch((m) => ({
              ...m,
              error: true,
              blocks: [...m.blocks, { type: "text", text: `\n\n⚠️ ${evt.message}` }],
            }));
            break;
          case "done":
            break;
        }
      }
    },
    [busy, sessionId, agentName],
  );

  return { messages, busy, sessionId, send, stop, reset };
}
