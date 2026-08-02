"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Target, NotebookPen, RefreshCw, Settings2, Check } from "lucide-react";
import { getVaultConfig, saveToVault, readTodayNote, nowParts } from "@/lib/vault";

export function JournalPanel() {
  const [configured, setConfigured] = useState(true);
  const [goal, setGoal] = useState("");
  const [entry, setEntry] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const { date } = nowParts();

  const refresh = useCallback(async () => {
    setNote(await readTodayNote());
  }, []);

  useEffect(() => {
    setConfigured(!!getVaultConfig().path);
    refresh();
  }, [refresh]);

  const add = async (heading: string, body: string, clear: () => void) => {
    if (!body.trim()) return;
    const res = await saveToVault(heading, body.trim());
    if (res.ok) {
      clear();
      setFlash(heading);
      setTimeout(() => setFlash(null), 1600);
      refresh();
    } else if (res.error) {
      setFlash(`⚠️ ${res.error}`);
    } else if (res.skipped) {
      setConfigured(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
          <p className="mt-1 text-sm text-white/45">Capture goals and reflections — saved to today&apos;s note.</p>
        </div>
        <span className="mono text-xs text-white/35">{date}</span>
      </motion.div>

      {!configured && (
        <div className="glass mt-5 flex items-center justify-between gap-3 border-amber/30 p-4">
          <p className="text-sm text-white/60">
            No vault connected yet — set your Obsidian folder to start saving.
          </p>
          <Link
            href="/settings"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
          >
            <Settings2 size={13} /> Settings
          </Link>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Target size={15} className="text-lime" /> Add a goal
          </h2>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add("🎯 Goal", goal, () => setGoal(""))}
            placeholder="e.g. Ship the vault integration"
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={() => add("🎯 Goal", goal, () => setGoal(""))}
            disabled={!goal.trim()}
            className="mt-3 rounded-xl bg-lime/80 px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            Save goal
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <NotebookPen size={15} className="text-electric" /> Journal entry
          </h2>
          <textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            rows={3}
            placeholder="What's on your mind?"
            className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={() => add("📓 Journal", entry, () => setEntry(""))}
            disabled={!entry.trim()}
            className="mt-3 rounded-xl bg-electric px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            Save entry
          </button>
        </motion.div>
      </div>

      {flash && (
        <div className="mt-4 flex items-center gap-2 text-sm text-lime">
          <Check size={14} /> Saved {flash} to today&apos;s note
        </div>
      )}

      {/* Today's note preview */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Today&apos;s note</h2>
          <button onClick={refresh} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        {note.trim() ? (
          <pre className="mono max-h-[26rem] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-black/30 p-4 text-[12px] leading-relaxed text-white/70">
            {note}
          </pre>
        ) : (
          <p className="rounded-xl bg-black/20 p-4 text-sm text-white/35">
            Nothing logged yet today. Chat with an agent or add a goal above — it&apos;ll appear here
            and in Obsidian.
          </p>
        )}
      </motion.div>
    </div>
  );
}
