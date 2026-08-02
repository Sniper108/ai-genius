"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Square,
  RotateCcw,
  Wrench,
  Brain,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useClaudeStream, type ClaudeMessage, type Block } from "@/lib/useClaudeStream";

const SUGGESTIONS = [
  "Summarize what this repo does",
  "List the files you can see and their purpose",
  "What's my git status right now?",
  "Draft a plan to add a settings page",
];

export function ClaudeConsole() {
  const { messages, busy, sessionId, send, stop, reset } = useClaudeStream();
  const [input, setInput] = useState("");
  const [yolo, setYolo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    if (!input.trim() || busy) return;
    send(input, { yolo });
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* Console header */}
      <div className="flex items-center justify-between border-b border-white/10 px-1 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-claude to-amber shadow-glow shadow-claude/40">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              Claude Console
              <span className="chip !text-[10px] !text-claude">CLI Bridge</span>
            </h2>
            <p className="mono text-xs text-white/40">
              {sessionId ? `session ${sessionId.slice(0, 8)}…` : "no active session"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYolo((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
              yolo
                ? "border-rose/50 bg-rose/15 text-rose shadow-glow shadow-rose/30"
                : "border-white/10 bg-white/5 text-white/50 hover:text-white"
            }`}
            title="Skip permission prompts (use with care)"
          >
            <Zap size={13} /> YOLO
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-all hover:text-white"
          >
            <RotateCcw size={13} /> New
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-1 py-6">
        {messages.length === 0 && <EmptyState onPick={(s) => send(s, { yolo })} />}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 pt-4">
        <div className="glass flex items-end gap-2 p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Command Claude…  (Enter to send · Shift+Enter for newline)"
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          {busy ? (
            <button
              onClick={stop}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose/90 text-white transition-transform hover:scale-105 active:scale-95"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-cyan text-white shadow-glow shadow-electric/40 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:shadow-none"
            >
              <ArrowUp size={18} />
            </button>
          )}
        </div>
        <p className="mono mt-2 px-1 text-center text-[10px] text-white/25">
          Wired to your local <span className="text-white/40">claude</span> CLI · runs in{" "}
          <span className="text-white/40">this repo</span>
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (s: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-claude to-amber shadow-glow-lg shadow-claude/40">
        <Sparkles size={34} className="text-white" />
        <span className="absolute inset-0 animate-pulse-ring rounded-3xl bg-claude/40" />
      </div>
      <h3 className="text-xl font-bold">Claude is standing by</h3>
      <p className="mt-1 max-w-sm text-sm text-white/40">
        Full Claude Code CLI access — it can read this repo, run tools, and act on your commands.
      </p>
      <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="glass glass-hover rounded-xl px-4 py-3 text-left text-sm text-white/70"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function MessageBubble({ message }: { message: ClaudeMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <div className="mb-1.5 flex items-center gap-2 px-1">
            <Sparkles size={13} className="text-claude" />
            <span className="text-xs font-semibold text-claude">Claude</span>
            {message.streaming && (
              <span className="mono text-[10px] text-white/40">streaming…</span>
            )}
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-electric/90 to-electric/70 text-white shadow-glow shadow-electric/30"
              : "glass text-white/85"
          } ${message.error ? "!border-rose/40" : ""}`}
        >
          {message.blocks.length === 0 && message.streaming ? (
            <TypingDots />
          ) : (
            <div className="space-y-2">
              {message.blocks.map((b, i) => (
                <BlockView key={i} block={b} />
              ))}
            </div>
          )}
        </div>
        {message.meta && (
          <div className="mono mt-1.5 flex items-center gap-3 px-1 text-[10px] text-white/35">
            {message.meta.costUsd != null && (
              <span>${message.meta.costUsd.toFixed(4)}</span>
            )}
            {message.meta.durationMs != null && (
              <span>{(message.meta.durationMs / 1000).toFixed(1)}s</span>
            )}
            {message.meta.numTurns != null && <span>{message.meta.numTurns} turns</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.type === "text") {
    return <p className="whitespace-pre-wrap break-words">{block.text}</p>;
  }
  if (block.type === "thinking") {
    return (
      <Collapsible
        icon={<Brain size={13} className="text-electric" />}
        label="Thinking"
        tone="electric"
      >
        <p className="whitespace-pre-wrap break-words text-xs text-white/50">{block.text}</p>
      </Collapsible>
    );
  }
  if (block.type === "tool_use") {
    return (
      <Collapsible
        icon={<Wrench size={13} className="text-cyan" />}
        label={`Tool · ${block.name}`}
        tone="cyan"
      >
        <pre className="mono overflow-x-auto whitespace-pre-wrap break-words text-[11px] text-white/50">
          {JSON.stringify(block.input, null, 2)}
        </pre>
      </Collapsible>
    );
  }
  // tool_result
  return (
    <Collapsible
      icon={<ChevronRight size={13} className={block.isError ? "text-rose" : "text-lime"} />}
      label={block.isError ? "Result · error" : "Result"}
      tone={block.isError ? "rose" : "lime"}
    >
      <pre className="mono max-h-52 overflow-y-auto whitespace-pre-wrap break-words text-[11px] text-white/50">
        {block.text || "(empty)"}
      </pre>
    </Collapsible>
  );
}

function Collapsible({
  icon,
  label,
  tone,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {icon}
        <span className="text-xs font-medium text-white/70">{label}</span>
        <ChevronDown
          size={13}
          className={`ml-auto text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/10 px-3 py-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-claude"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}
