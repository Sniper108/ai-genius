"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Radio } from "lucide-react";
import type { AgentDef, AgentStatus } from "@/lib/types";
import { useCliStream } from "@/lib/useCliStream";
import { getOmniModel } from "@/lib/omniroute";
import { ChatShell } from "./chat/ChatShell";
import { MessageRow, TypingDots } from "./chat/MessageRow";
import { AgentAvatar } from "./Avatar";

/** A real, live chat for agents backed by a local CLI bridge (e.g. Hermes). */
export function LiveAgentChat({ agent, status }: { agent: AgentDef; status: AgentStatus }) {
  const isOmni = agent.id === "omniroute";
  const { messages, busy, send, stop, reset } = useCliStream(
    agent.bridge!,
    agent.id,
    agent.name,
    isOmni ? () => ({ model: getOmniModel() }) : undefined,
  );
  const [input, setInput] = useState("");
  const [omniModel, setOmniModelState] = useState("auto");

  useEffect(() => {
    if (isOmni) setOmniModelState(getOmniModel());
  }, [isOmni, messages.length]);

  const submit = () => {
    if (!input.trim() || busy) return;
    send(input);
    setInput("");
  };

  const headerRight = (
    <>
      {agent.id === "hermes" && (
        <Link
          href="/gateway"
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all"
          style={{ borderColor: `${agent.accent}50`, color: agent.accent }}
        >
          <Radio size={13} /> Gateway
        </Link>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/50 transition-all hover:text-white"
      >
        <RotateCcw size={13} /> New
      </button>
    </>
  );

  return (
    <ChatShell
      agent={agent}
      status={status}
      headerRight={headerRight}
      scrollSignal={messages.reduce((n, m) => n + m.text.length, messages.length)}
      input={input}
      setInput={setInput}
      onSend={submit}
      onStop={stop}
      busy={busy}
      placeholder={`Message ${agent.name}…  (Enter to send)`}
      footerNote={
        isOmni ? (
          <>
            Live · model <span className="text-white/45">{omniModel}</span> · change it in{" "}
            <Link href="/settings" className="text-white/45 underline hover:text-white/70">
              Settings
            </Link>
          </>
        ) : (
          <>Live · {agent.bridgeNote ?? `streaming from your local ${agent.name}`}</>
        )
      }
    >
      {messages.length === 0 ? (
        <EmptyState agent={agent} onPick={(s) => send(s)} />
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageRow key={m.id} role={m.role} agent={agent} error={m.error}>
              {m.role === "assistant" && m.streaming && !m.text ? (
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

function EmptyState({ agent, onPick }: { agent: AgentDef; onPick: (s: string) => void }) {
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
        {agent.capabilities.slice(0, 4).map((s) => (
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
