"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square, Paperclip, X } from "lucide-react";
import type { AgentDef, AgentStatus } from "@/lib/types";
import type { ChatAttachment } from "@/lib/attachments";
import { AgentAvatar } from "@/components/Avatar";
import { StatusDot } from "@/components/StatusDot";
import { MicButton } from "@/components/MicButton";

export function ChatShell({
  agent,
  status,
  headerRight,
  children,
  scrollSignal,
  input,
  setInput,
  onSend,
  onStop,
  busy,
  placeholder,
  disabled,
  footerNote,
  enableAttachments,
}: {
  agent: AgentDef;
  status: AgentStatus;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  /** Change this (e.g. message count) to trigger auto-scroll to bottom. */
  scrollSignal: number;
  input: string;
  setInput: (v: string) => void;
  onSend: (attachments: ChatAttachment[]) => void;
  onStop?: () => void;
  busy: boolean;
  placeholder?: string;
  disabled?: boolean;
  footerNote?: React.ReactNode;
  enableAttachments?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.url) setPending((p) => [...p, data]);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const canSend = (input.trim().length > 0 || pending.length > 0) && !disabled;
  const trigger = () => {
    if (!canSend) return;
    onSend(pending);
    setPending([]);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [scrollSignal]);

  // auto-grow the textarea
  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-black/20 px-5 py-3 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-3">
          <AgentAvatar agent={agent} size={40} glow />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold">{agent.name}</h1>
              {agent.kind === "claude" || agent.bridge ? (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: `${agent.accent}22`, color: agent.accent }}
                >
                  LIVE
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/40">
                  DEMO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <StatusDot status={status} />
              <span className="truncate">{agent.tagline}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">{headerRight}</div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
      </div>

      {/* Composer */}
      <div className="border-t border-white/[0.06] bg-black/20 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          {enableAttachments && (
            <input
              ref={fileRef}
              type="file"
              onChange={onFile}
              className="hidden"
              accept="image/*,.pdf,.txt,.md,.csv,.json,.doc,.docx,.xls,.xlsx"
            />
          )}
          {pending.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {pending.map((a) => (
                <span key={a.url} className="chip !text-[10px]">
                  <Paperclip size={10} />
                  <span className="max-w-[11rem] truncate">{a.name}</span>
                  <button
                    onClick={() => setPending((p) => p.filter((x) => x.url !== a.url))}
                    className="ml-1 text-white/40 hover:text-rose"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 transition-colors focus-within:border-white/20">
            <textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  trigger();
                }
              }}
              rows={1}
              disabled={disabled}
              placeholder={placeholder ?? `Message ${agent.name}…`}
              className="max-h-[200px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none disabled:opacity-50"
            />
            {enableAttachments && (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || disabled}
                title="Attach a file for context (you pick it)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/45 transition-all hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <Paperclip size={16} />
              </button>
            )}
            <MicButton value={input} onChange={setInput} accent={agent.accent} disabled={disabled} />
            {busy && onStop ? (
              <button
                onClick={onStop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose/90 text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Stop"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={trigger}
                disabled={!canSend}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-25"
                style={{ backgroundImage: `linear-gradient(135deg, ${agent.gradient[0]}, ${agent.gradient[1]})` }}
                aria-label="Send"
              >
                <ArrowUp size={17} />
              </button>
            )}
          </div>
          {footerNote && (
            <p className="mt-2 text-center text-[10px] text-white/25">{footerNote}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** A tidy hook for a controlled composer input. */
export function useComposer(initial = "") {
  return useState(initial);
}
