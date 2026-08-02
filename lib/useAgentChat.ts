"use client";

import { useCallback, useRef, useState } from "react";
import type { AgentDef } from "./types";

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  typing?: boolean;
}

let uid = 0;
const nextId = () => `am${Date.now()}_${uid++}`;

/**
 * A lightweight, in-character chat for external agents. These agents don't have
 * a live backend yet, so replies are simulated locally (clearly marked "DEMO"
 * in the UI). Swap `respond` for a real fetch to `agent.endpoint` to go live.
 */
export function useAgentChat(agent: AgentDef) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setMessages([]);
    setBusy(false);
  }, []);

  const send = useCallback(
    (text: string) => {
      if (!text.trim() || busy) return;
      const userMsg: AgentMessage = { id: nextId(), role: "user", text };
      const typingId = nextId();
      setMessages((p) => [...p, userMsg, { id: typingId, role: "assistant", text: "", typing: true }]);
      setBusy(true);

      const delay = 700 + Math.random() * 900;
      timer.current = setTimeout(() => {
        setMessages((p) =>
          p.map((m) => (m.id === typingId ? { ...m, text: respond(agent, text), typing: false } : m)),
        );
        setBusy(false);
      }, delay);
    },
    [agent, busy],
  );

  return { messages, busy, send, reset };
}

function respond(agent: AgentDef, prompt: string): string {
  const p = prompt.trim();
  const short = p.length > 60 ? p.slice(0, 57) + "…" : p;

  const byAgent: Record<string, string> = {
    openclaw: `Spinning up a headless browser to handle "${short}". I'd navigate, extract the structured data, and return it as JSON.`,
    hermes: `On it — I'd draft and route "${short}" across your connected inboxes and channels, then summarize the replies.`,
    atlas: `Researching "${short}" now — gathering sources, cross-referencing, and synthesizing a cited report.`,
  };

  const base =
    byAgent[agent.id] ??
    `Acknowledged: "${short}". I'd execute this workflow and report back with results.`;

  return `${base}\n\n(Demo response — connect ${agent.name}${
    agent.endpoint ? ` at ${agent.endpoint}` : ""
  } to run this for real.)`;
}
