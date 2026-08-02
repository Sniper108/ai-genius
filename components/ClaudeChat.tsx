"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Wrench, ChevronRight, Zap, RotateCcw } from "lucide-react";
import type { AgentDef, AgentStatus } from "@/lib/types";
import { useClaudeStream, type Block, type ClaudeMessage } from "@/lib/useClaudeStream";
import { ChatShell } from "./chat/ChatShell";
import { MessageRow, TypingDots } from "./chat/MessageRow";
import { Collapsible } from "./chat/Collapsible";
import { AgentAvatar } from "./Avatar";

const SUGGESTIONS = [
  "Summarize what this repo does",
  "What's my git status right now?",
  "List the files you can see",
  "Draft a plan to add a settings page",
];

export function ClaudeChat({ agent, status }: { agent: AgentDef; status: AgentStatus }) {
  const { messages, busy, sessionId, send, stop, reset } = useClaudeStream(agent.id);
  const [input, setInput] = useState("");
  const [yolo, setYolo] = useState(false);

  const submit = () => {
    if (!input.trim() || busy) return;
    send(input, { yolo });
    setInput("");
  };

  const headerRight = (
    <>
      <button
        onClick={() => setYolo((v) => !v)}
        title="Skip permission prompts (use with care)"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
          yolo
            ? "border-rose/50 bg-rose/15 text-rose"
            : "border-white/10 bg-white/5 text-white/50 hover:text-white"
        }`}
      >
        <Zap size={13} /> YOLO
      </button>
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
      scrollSignal={messages.reduce((n, m) => n + m.blocks.length, messages.length)}
      input={input}
      setInput={setInput}
      onSend={submit}
      onStop={stop}
      busy={busy}
      placeholder="Message Claude…  (Enter to send · Shift+Enter for newline)"
      footerNote={
        <>
          Wired to your local <span className="text-white/40">claude</span> CLI
          {sessionId ? ` · session ${sessionId.slice(0, 8)}…` : ""}
        </>
      }
    >
      {messages.length === 0 ? (
        <EmptyState agent={agent} onPick={(s) => send(s, { yolo })} />
      ) : (
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <ClaudeMessageRow key={m.id} agent={agent} message={m} />
          ))}
        </AnimatePresence>
      )}
    </ChatShell>
  );
}

function ClaudeMessageRow({ agent, message }: { agent: AgentDef; message: ClaudeMessage }) {
  const meta = message.meta ? (
    <span className="flex items-center gap-3">
      {message.meta.costUsd != null && <span>${message.meta.costUsd.toFixed(4)}</span>}
      {message.meta.durationMs != null && <span>{(message.meta.durationMs / 1000).toFixed(1)}s</span>}
      {message.meta.numTurns != null && <span>{message.meta.numTurns} turns</span>}
    </span>
  ) : undefined;

  return (
    <MessageRow role={message.role} agent={agent} meta={meta} error={message.error}>
      {message.blocks.length === 0 && message.streaming ? (
        <TypingDots color={agent.accent} />
      ) : (
        <div className="space-y-1">
          {message.blocks.map((b, i) => (
            <BlockView key={i} block={b} accent={agent.accent} />
          ))}
        </div>
      )}
    </MessageRow>
  );
}

function BlockView({ block, accent }: { block: Block; accent: string }) {
  if (block.type === "text") {
    return <p className="whitespace-pre-wrap break-words">{block.text}</p>;
  }
  if (block.type === "thinking") {
    return (
      <Collapsible icon={<Brain size={13} style={{ color: accent }} />} label="Thinking">
        <p className="whitespace-pre-wrap break-words text-xs text-white/50">{block.text}</p>
      </Collapsible>
    );
  }
  if (block.type === "tool_use") {
    return (
      <Collapsible icon={<Wrench size={13} className="text-cyan" />} label={`Tool · ${block.name}`}>
        <pre className="mono overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-white/50">
          {JSON.stringify(block.input, null, 2)}
        </pre>
      </Collapsible>
    );
  }
  return (
    <Collapsible
      icon={<ChevronRight size={13} className={block.isError ? "text-rose" : "text-lime"} />}
      label={block.isError ? "Result · error" : "Result"}
    >
      <pre className="mono max-h-52 overflow-y-auto whitespace-pre-wrap break-words text-[11px] text-white/50">
        {block.text || "(empty)"}
      </pre>
    </Collapsible>
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
      <h3 className="mt-5 text-xl font-semibold">Claude is standing by</h3>
      <p className="mt-1 max-w-sm text-sm text-white/45">
        Full Claude Code CLI access — it can read this repo, run tools, and act on your commands.
      </p>
      <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
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
