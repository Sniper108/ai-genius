"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Square, Users } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { AgentAvatar } from "./Avatar";
import { getOmniModel } from "@/lib/omniroute";
import { TypingDots } from "./chat/MessageRow";

// Only agents with a real bridge (or Claude) can answer.
const PARTICIPANTS = AGENTS.filter((a) => a.kind === "claude" || a.bridge);

interface AnswerState {
  text: string;
  streaming: boolean;
  error?: boolean;
}

async function streamAgent(
  endpoint: string,
  body: unknown,
  opts: { onText: (t: string) => void; onErr: (m: string) => void; signal: AbortSignal },
) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.body) throw new Error("No response stream");
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const f of frames) {
      const line = f.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      let evt: any;
      try {
        evt = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (evt.kind === "text") opts.onText(evt.text);
      else if (evt.kind === "error") opts.onErr(evt.message);
    }
  }
}

export function BoardroomView() {
  const [selected, setSelected] = useState<string[]>(PARTICIPANTS.map((a) => a.id));
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [busy, setBusy] = useState(false);
  const controllers = useRef<AbortController[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const stop = () => {
    controllers.current.forEach((c) => c.abort());
    controllers.current = [];
    setBusy(false);
    setAnswers((a) => {
      const n = { ...a };
      for (const k in n) n[k] = { ...n[k], streaming: false };
      return n;
    });
  };

  const ask = async () => {
    if (!prompt.trim() || busy) return;
    const agents = PARTICIPANTS.filter((a) => selected.includes(a.id));
    if (!agents.length) return;

    setBusy(true);
    const init: Record<string, AnswerState> = {};
    agents.forEach((a) => (init[a.id] = { text: "", streaming: true }));
    setAnswers(init);
    controllers.current = [];
    const p = prompt;

    await Promise.all(
      agents.map(async (a) => {
        const controller = new AbortController();
        controllers.current.push(controller);
        const endpoint = a.kind === "claude" ? "/api/claude" : a.bridge!;
        const body = { prompt: p, ...(a.id === "omniroute" ? { model: getOmniModel() } : {}) };
        const patch = (fn: (s: AnswerState) => AnswerState) =>
          setAnswers((prev) => ({ ...prev, [a.id]: fn(prev[a.id] || { text: "", streaming: true }) }));
        try {
          await streamAgent(endpoint, body, {
            onText: (t) => patch((s) => ({ ...s, text: s.text + t })),
            onErr: (m) => patch((s) => ({ ...s, error: true, text: (s.text ? s.text + "\n\n" : "") + `⚠️ ${m}` })),
            signal: controller.signal,
          });
        } catch (e: any) {
          if (e?.name !== "AbortError")
            patch((s) => ({ ...s, error: true, text: (s.text ? s.text + "\n\n" : "") + `⚠️ ${e?.message ?? e}` }));
        } finally {
          patch((s) => ({ ...s, streaming: false }));
        }
      }),
    );
    setBusy(false);
  };

  const selectedAgents = PARTICIPANTS.filter((a) => selected.includes(a.id));

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users size={22} className="text-electric" /> Boardroom
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Ask your whole fleet one question and compare their answers side by side.
        </p>
      </motion.div>

      {/* Participant toggles */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PARTICIPANTS.map((a) => {
          const on = selected.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-all ${
                on ? "border-white/20 bg-white/[0.08] text-white" : "border-white/10 bg-white/[0.02] text-white/40"
              }`}
            >
              <AgentAvatar agent={a} size={18} />
              {a.name}
            </button>
          );
        })}
      </div>

      {/* Composer */}
      <div className="glass mt-4 flex items-end gap-2 p-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          rows={1}
          placeholder="Ask the room…  (e.g. What are 5 trending fashion products right now?)"
          className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
        />
        {busy ? (
          <button
            onClick={stop}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose/90 text-white transition-transform hover:scale-105 active:scale-95"
          >
            <Square size={15} fill="currentColor" />
          </button>
        ) : (
          <button
            onClick={ask}
            disabled={!prompt.trim() || selectedAgents.length === 0}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-electric to-cyan px-4 text-sm font-semibold text-white shadow-glow shadow-electric/40 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:shadow-none"
          >
            <Send size={15} /> Ask the room
          </button>
        )}
      </div>

      {/* Answers grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {selectedAgents.map((a) => {
          const ans = answers[a.id];
          return (
            <motion.div key={a.id} layout className="glass flex h-80 flex-col p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-3">
                <AgentAvatar agent={a} size={26} />
                <span className="text-sm font-semibold">{a.name}</span>
                {ans?.streaming && <span className="mono text-[10px] text-white/40">streaming…</span>}
                {ans && !ans.streaming && !ans.error && (
                  <span className="ml-auto text-[10px] font-medium text-lime">done</span>
                )}
                {ans?.error && <span className="ml-auto text-[10px] font-medium text-rose">error</span>}
              </div>
              <div className="flex-1 overflow-y-auto text-sm leading-relaxed text-white/85">
                {!ans ? (
                  <p className="text-white/25">Ask the room to see {a.name}&apos;s answer here.</p>
                ) : ans.streaming && !ans.text ? (
                  <TypingDots color={a.accent} />
                ) : (
                  <p className="whitespace-pre-wrap break-words">{ans.text}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
