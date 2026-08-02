"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearHistory, readHistory, useAutoSave } from "./useChatHistory";

export interface CliMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
  error?: boolean;
}

let uid = 0;
const nextId = () => `c${Date.now()}_${uid++}`;

/**
 * Streams a plain-text CLI bridge (e.g. /api/hermes) into a simple chat.
 * The bridge emits SSE `event: <name>` frames with JSON payloads of shape
 * { kind: "text" | "error" | "done", ... }.
 */
export function useCliStream(endpoint: string, storageKey?: string) {
  const [messages, setMessages] = useState<CliMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Restore persisted history once, on mount.
  useEffect(() => {
    const h = readHistory<{ messages: CliMessage[] }>(storageKey);
    if (h?.messages?.length) {
      const restored = h.messages
        .map((m) => ({ ...m, streaming: false }))
        .filter((m) => m.role === "user" || m.text.trim().length > 0);
      setMessages(restored);
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useAutoSave(storageKey, { messages }, loaded);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setBusy(false);
    clearHistory(storageKey);
  }, [storageKey]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setBusy(false);
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)));
  }, []);

  const send = useCallback(
    async (prompt: string) => {
      if (!prompt.trim() || busy) return;

      const userMsg: CliMessage = { id: nextId(), role: "user", text: prompt };
      const assistantId = nextId();
      setMessages((p) => [
        ...p,
        userMsg,
        { id: assistantId, role: "assistant", text: "", streaming: true },
      ]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patch = (fn: (m: CliMessage) => CliMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
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
            const line = frame.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            let evt: any;
            try {
              evt = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (evt.kind === "text") {
              patch((m) => ({ ...m, text: m.text + evt.text }));
            } else if (evt.kind === "error") {
              patch((m) => ({
                ...m,
                error: true,
                text: (m.text ? m.text + "\n\n" : "") + `⚠️ ${evt.message}`,
              }));
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          patch((m) => ({
            ...m,
            error: true,
            text: (m.text ? m.text + "\n\n" : "") + `⚠️ Bridge error: ${err?.message ?? err}`,
          }));
        }
      } finally {
        patch((m) => ({ ...m, streaming: false }));
        setBusy(false);
      }
    },
    [busy, endpoint],
  );

  return { messages, busy, send, stop, reset };
}
