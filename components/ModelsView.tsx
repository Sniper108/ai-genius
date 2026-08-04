"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Plus, Check, Trash2, Zap, Star, Send, Loader2, AlertTriangle } from "lucide-react";
import {
  getModels,
  saveModels,
  getActiveModel,
  setActiveModel,
  getHermesModels,
  saveHermesModels,
  getHermesModel,
  setHermesModel,
  type ModelEntry,
} from "@/lib/models";

interface Target {
  key: string;
  label: string;
  accent: string;
  endpoint: string;
  hint: string;
  placeholder: string;
  get: () => ModelEntry[];
  save: (l: ModelEntry[]) => void;
  getActive: () => string;
  setActive: (id: string) => void;
  fallback: string;
}

const TARGETS: Target[] = [
  {
    key: "omniroute",
    label: "OmniRoute",
    accent: "#2dd4bf",
    endpoint: "/api/omniroute",
    hint: "localhost:20128/v1/models",
    placeholder: "model id  ·  e.g. aug/kimi-k2.7",
    get: getModels,
    save: saveModels,
    getActive: getActiveModel,
    setActive: setActiveModel,
    fallback: "auto",
  },
  {
    key: "hermes",
    label: "Hermes",
    accent: "#a3e635",
    endpoint: "/api/hermes",
    hint: "run `hermes model` to list yours",
    placeholder: "model id  ·  e.g. anthropic/claude-sonnet-4.6",
    get: getHermesModels,
    save: saveHermesModels,
    getActive: getHermesModel,
    setActive: setHermesModel,
    fallback: "",
  },
];

export function ModelsView() {
  const [targetKey, setTargetKey] = useState("omniroute");
  const target = TARGETS.find((t) => t.key === targetKey)!;

  const [models, setModels] = useState<ModelEntry[]>([]);
  const [active, setActive] = useState("");
  const [form, setForm] = useState({ id: "", label: "", note: "", free: true });

  // Inline model tester
  const [testPrompt, setTestPrompt] = useState("Say hello in one short sentence and name the model you are.");
  const [testing, setTesting] = useState(false);
  const [testOut, setTestOut] = useState("");
  const [testErr, setTestErr] = useState("");
  const [testMs, setTestMs] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load the catalog + active model whenever the target changes.
  useEffect(() => {
    setModels(target.get());
    setActive(target.getActive());
    setTestOut("");
    setTestErr("");
    setTestMs(null);
  }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (id: string) => {
    setActive(id);
    target.setActive(id);
  };

  const add = () => {
    const id = form.id.trim();
    if (models.some((x) => x.id === id)) return; // no dupes (also blocks empty re-add)
    const next = [
      ...models,
      { id, label: form.label.trim() || id || "Default", note: form.note.trim() || undefined, free: form.free },
    ];
    setModels(next);
    target.save(next);
    setForm({ id: "", label: "", note: "", free: true });
  };

  const remove = (id: string) => {
    const next = models.filter((x) => x.id !== id);
    const list = next.length ? next : [{ id: target.fallback, label: "Default", free: true }];
    setModels(list);
    target.save(list);
    if (active === id) choose(list[0]?.id ?? target.fallback);
  };

  const runTest = async () => {
    if (testing) {
      abortRef.current?.abort();
      return;
    }
    setTesting(true);
    setTestOut("");
    setTestErr("");
    setTestMs(null);
    const started = Date.now();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch(target.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: testPrompt, model: active }),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(t.slice(5).trim());
            if (evt.kind === "text") setTestOut((o) => o + evt.text);
            else if (evt.kind === "error") setTestErr(evt.message || "Model error");
          } catch {
            /* ignore keepalive */
          }
        }
      }
      setTestMs(Date.now() - started);
    } catch (err: any) {
      if (err?.name !== "AbortError") setTestErr(err?.message ?? "Test failed");
    } finally {
      setTesting(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Cpu size={22} className="text-cyan" /> Models
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Pick which model each agent runs on. Tap one to make it active, or add any id from{" "}
          <span className="mono text-white/60">{target.hint}</span>.
        </p>
      </motion.div>

      {/* Target tabs */}
      <div className="mt-5 inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {TARGETS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTargetKey(t.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
              targetKey === t.key ? "text-black" : "text-white/50 hover:text-white"
            }`}
            style={targetKey === t.key ? { backgroundColor: t.accent } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalog */}
      <div className="mt-5 space-y-2">
        {models.map((m) => {
          const isActive = m.id === active;
          return (
            <button
              key={m.id || "__default__"}
              onClick={() => choose(m.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
              style={isActive ? { borderColor: `${target.accent}80`, backgroundColor: `${target.accent}12` } : undefined}
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={
                  isActive
                    ? { backgroundColor: `${target.accent}33`, color: target.accent }
                    : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }
                }
              >
                {isActive ? <Star size={16} fill="currentColor" /> : <Cpu size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{m.label}</span>
                  {m.free && (
                    <span className="rounded bg-lime/15 px-1.5 py-px text-[9px] font-bold text-lime">FREE</span>
                  )}
                  {isActive && (
                    <span
                      className="rounded px-1.5 py-px text-[9px] font-bold"
                      style={{ backgroundColor: `${target.accent}33`, color: target.accent }}
                    >
                      ACTIVE
                    </span>
                  )}
                </span>
                <span className="mono block truncate text-[11px] text-white/35">{m.id || "(uses agent default)"}</span>
                {m.note && <span className="block truncate text-xs text-white/45">{m.note}</span>}
              </span>
              {isActive ? (
                <Check size={16} className="shrink-0" style={{ color: target.accent }} />
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(m.id);
                  }}
                  className="shrink-0 rounded-lg p-1.5 text-white/25 transition-colors hover:bg-white/10 hover:text-rose"
                  title="Remove"
                >
                  <Trash2 size={15} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Test the active model */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 p-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Send size={15} style={{ color: target.accent }} /> Test the active {target.label} model
          <span className="mono ml-auto text-[11px] font-normal text-white/35">{active || "(default)"}</span>
        </h2>
        <p className="mt-1 text-xs text-white/45">
          Sends a quick prompt to {target.label} on the active model, so you can confirm it responds.
        </p>
        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                runTest();
              }
            }}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={runTest}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: testing ? "rgba(244,63,94,0.8)" : target.accent }}
          >
            {testing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {testing ? "Stop" : "Test"}
          </button>
        </div>

        {(testOut || testErr || testing) && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
            {testErr ? (
              <div className="flex items-start gap-2 text-sm text-rose">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{testErr}</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap break-words text-sm text-white/85">
                {testOut || <span className="text-white/30">Waiting for the model…</span>}
              </p>
            )}
            {testMs != null && !testErr && (
              <p className="mono mt-2 text-[11px] text-white/30">Responded in {(testMs / 1000).toFixed(1)}s</p>
            )}
          </div>
        )}
        {testErr && targetKey === "omniroute" && (
          <p className="mt-2 text-[11px] text-white/40">
            Tip: this needs OmniRoute running. Launch it from your Agent OS icon, or run{" "}
            <span className="mono text-white/60">omniroute</span> in a terminal, then try again.
          </p>
        )}
        {testErr && targetKey === "hermes" && (
          <p className="mt-2 text-[11px] text-white/40">
            Tip: if a specific model id fails, it may not exist in your Hermes setup — run{" "}
            <span className="mono text-white/60">hermes model</span> to see valid ids, or switch back to
            &quot;Hermes default&quot;.
          </p>
        )}
      </motion.div>

      {/* Add a model */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass mt-6 p-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Plus size={16} className="text-lime" /> Add a {target.label} model
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            placeholder={target.placeholder}
            className="mono rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="friendly name (optional)"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
        </div>
        <input
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="short note (optional)"
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => setForm((f) => ({ ...f, free: !f.free }))}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
              form.free ? "border-lime/40 bg-lime/10 text-lime" : "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            <Zap size={13} /> {form.free ? "Free" : "Paid"}
          </button>
          <button
            onClick={add}
            disabled={!form.id.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-cyan to-electric px-4 py-2.5 text-sm font-semibold text-white shadow-glow shadow-cyan/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            <Plus size={15} /> Add
          </button>
        </div>
      </motion.div>

      <p className="mono mt-4 text-[11px] leading-relaxed text-white/30">
        {targetKey === "omniroute"
          ? "The active OmniRoute model is used by the OmniRoute agent and the Boardroom."
          : "The active Hermes model is passed to Hermes on every message. “Hermes default” leaves it to your `hermes model` setting."}
      </p>
    </div>
  );
}
