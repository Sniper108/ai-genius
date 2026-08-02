"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import type { AgentDef, AgentStatus } from "@/lib/types";
import { useAgentChat } from "@/lib/useAgentChat";
import { ChatShell } from "./chat/ChatShell";
import { MessageRow, TypingDots } from "./chat/MessageRow";
import { AgentAvatar } from "./Avatar";

export function AgentChat({ agent, status }: { agent: AgentDef; status: AgentStatus }) {
  const { messages, busy, send, reset } = useAgentChat(agent);
  const [input, setInput] = useState("");

  const submit = () => {
    if (!input.trim() || busy) return;
    send(input);
    setInput("");
  };

  const headerRight = (
    <button
      onClick={reset}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/50 transition-all hover:text-white"
    >
      <RotateCcw size={13} /> New
    </button>
  );

  const starters = agent.capabilities.slice(0, 4);

  return (
    <ChatShell
      agent={agent}
      status={status}
      headerRight={headerRight}
      scrollSignal={messages.length + (busy ? 1 : 0)}
      input={input}
      setInput={setInput}
      onSend={submit}
      busy={busy}
      footerNote={
        <>
          Demo agent · connect at{" "}
          <span className="text-white/40">{agent.endpoint ?? "an endpoint"}</span> to go live
        </>
      }
    >
      {messages.length === 0 ? (
        <EmptyState agent={agent} onPick={(s) => send(s)} starters={starters} />
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageRow key={m.id} role={m.role} agent={agent}>
              {m.typing ? (
                <TypingDots color={agent.accent} />
              ) : (
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              )}
            </MessageRow>
          ))}
        </AnimatePresence>
      )}
    </ChatShell>
  );
}

function EmptyState({
  agent,
  onPick,
  starters,
}: {
  agent: AgentDef;
  onPick: (s: string) => void;
  starters: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <AgentAvatar agent={agent} size={72} glow />
      <h3 className="mt-5 text-xl font-semibold">{agent.name}</h3>
      <p className="mt-1 max-w-sm text-sm text-white/45">{agent.tagline}</p>
      <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left text-sm text-white/70 transition-all hover:border-white/15 hover:bg-white/[0.06]"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
