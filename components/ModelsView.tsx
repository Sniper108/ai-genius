"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Plus, Check, Trash2, Zap, Star } from "lucide-react";
import {
  getModels,
  saveModels,
  getActiveModel,
  setActiveModel,
  type ModelEntry,
} from "@/lib/models";

export function ModelsView() {
  const [models, setModels] = useState<ModelEntry[]>([]);
  const [active, setActive] = useState("auto");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ id: "", label: "", note: "", free: true });

  useEffect(() => {
    setModels(getModels());
    setActive(getActiveModel());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveModels(models);
  }, [models, loaded]);

  const choose = (id: string) => {
    setActive(id);
    setActiveModel(id);
  };

  const add = () => {
    const id = form.id.trim();
    if (!id) return;
    setModels((m) => {
      if (m.some((x) => x.id === id)) return m; // no dupes
      return [
        ...m,
        { id, label: form.label.trim() || id, note: form.note.trim() || undefined, free: form.free },
      ];
    });
    setForm({ id: "", label: "", note: "", free: true });
  };

  const remove = (id: string) =>
    setModels((m) => {
      const next = m.filter((x) => x.id !== id);
      if (active === id) choose(next[0]?.id ?? "auto");
      return next.length ? next : [{ id: "auto", label: "Auto (smart pick)", free: true }];
    });

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Cpu size={22} className="text-cyan" /> Models
        </h1>
        <p className="mt-1 text-sm text-white/45">
          The model your OmniRoute agent runs on. Tap one to make it active, or add any id from{" "}
          <span className="mono text-white/60">localhost:20128/v1/models</span>.
        </p>
      </motion.div>

      {/* Catalog */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mt-6 space-y-2"
      >
        {models.map((m) => {
          const isActive = m.id === active;
          return (
            <button
              key={m.id}
              onClick={() => choose(m.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                isActive
                  ? "border-cyan/50 bg-cyan/[0.07]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isActive ? "bg-cyan/20 text-cyan" : "bg-white/5 text-white/40"
                }`}
              >
                {isActive ? <Star size={16} fill="currentColor" /> : <Cpu size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{m.label}</span>
                  {m.free && (
                    <span className="rounded bg-lime/15 px-1.5 py-px text-[9px] font-bold text-lime">
                      FREE
                    </span>
                  )}
                  {isActive && (
                    <span className="rounded bg-cyan/20 px-1.5 py-px text-[9px] font-bold text-cyan">
                      ACTIVE
                    </span>
                  )}
                </span>
                <span className="mono block truncate text-[11px] text-white/35">{m.id}</span>
                {m.note && <span className="block truncate text-xs text-white/45">{m.note}</span>}
              </span>
              {isActive ? (
                <Check size={16} className="shrink-0 text-cyan" />
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
      </motion.div>

      {/* Add a model */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass mt-6 p-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Plus size={16} className="text-lime" /> Add a model
        </h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            placeholder="model id  ·  e.g. aug/kimi-k2.7"
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
              form.free
                ? "border-lime/40 bg-lime/10 text-lime"
                : "border-white/10 bg-white/5 text-white/50"
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
        The active model is used by the OmniRoute agent and the Boardroom. Other agents (Claude,
        Hermes, OpenClaw) pick their own model in their own tools.
      </p>
    </div>
  );
}
