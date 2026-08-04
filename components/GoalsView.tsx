"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Target, Plus, X, Check, Minus, Trophy } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  target: string;
  progress: number; // 0..100
  notes: string;
  created: number;
  done: boolean;
}

const KEY = "agentos.goals";
let uid = 0;
const nextId = () => `g${Date.now()}_${uid++}`;

export function GoalsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const saveT = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setGoals(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveT.current) clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(goals));
      } catch {
        /* ignore */
      }
    }, 200);
  }, [goals, loaded]);

  const add = () => {
    if (!title.trim()) return;
    setGoals((g) => [
      { id: nextId(), title: title.trim(), target: target.trim(), progress: 0, notes: "", created: Date.now(), done: false },
      ...g,
    ]);
    setTitle("");
    setTarget("");
  };

  const bump = (id: string, delta: number) =>
    setGoals((g) =>
      g.map((goal) => {
        if (goal.id !== id) return goal;
        const progress = Math.max(0, Math.min(100, goal.progress + delta));
        return { ...goal, progress, done: progress >= 100 };
      }),
    );

  const toggleDone = (id: string) =>
    setGoals((g) =>
      g.map((goal) =>
        goal.id === id ? { ...goal, done: !goal.done, progress: !goal.done ? 100 : goal.progress } : goal,
      ),
    );

  const setNotes = (id: string, notes: string) =>
    setGoals((g) => g.map((goal) => (goal.id === id ? { ...goal, notes } : goal)));

  const remove = (id: string) => setGoals((g) => g.filter((x) => x.id !== id));

  const active = goals.filter((g) => !g.done);
  const won = goals.filter((g) => g.done);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Target size={22} className="text-lime" /> Goals
          </h1>
          <p className="mt-1 text-sm text-white/45">Your growth targets. Track progress, save locally.</p>
        </div>
        <span className="mono text-xs text-white/35">
          {won.length}/{goals.length} done
        </span>
      </motion.div>

      {/* Add row */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 flex flex-col gap-2 p-3 sm:flex-row"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Goal…  (e.g. Test 3 new products every day)"
          className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="target (optional)"
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none sm:w-44"
        />
        <button
          onClick={add}
          disabled={!title.trim()}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-lime to-cyan px-4 py-2.5 text-sm font-semibold text-black/80 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
        >
          <Plus size={16} /> Add
        </button>
      </motion.div>

      {/* Active goals */}
      <div className="mt-6 space-y-3">
        <AnimatePresence initial={false}>
          {active.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onBump={bump}
              onToggle={toggleDone}
              onNotes={setNotes}
              onRemove={remove}
            />
          ))}
        </AnimatePresence>
        {active.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/30">
            No active goals yet — add one above to start tracking.
          </p>
        )}
      </div>

      {/* Won */}
      {won.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/60">
            <Trophy size={15} className="text-amber" /> Completed
          </div>
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {won.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onBump={bump}
                  onToggle={toggleDone}
                  onNotes={setNotes}
                  onRemove={remove}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function GoalCard({
  goal,
  onBump,
  onToggle,
  onNotes,
  onRemove,
}: {
  goal: Goal;
  onBump: (id: string, delta: number) => void;
  onToggle: (id: string) => void;
  onNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`group rounded-2xl border p-4 ${
        goal.done ? "border-amber/30 bg-amber/[0.05]" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(goal.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                goal.done ? "border-amber bg-amber text-black" : "border-white/25 hover:border-white/50"
              }`}
            >
              {goal.done && <Check size={13} />}
            </button>
            <span className={`text-sm font-semibold ${goal.done ? "text-white/50 line-through" : ""}`}>
              {goal.title}
            </span>
          </div>
          {goal.target && <span className="mt-0.5 block pl-7 text-xs text-white/40">🎯 {goal.target}</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="mono text-xs text-white/40">{goal.progress}%</span>
          <button
            onClick={() => onRemove(goal.id)}
            className="rounded-md p-1 text-white/20 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onBump(goal.id, -10)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Minus size={13} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            layout
            className="h-full rounded-full"
            style={{
              width: `${goal.progress}%`,
              backgroundImage: goal.done
                ? "linear-gradient(90deg,#fbbf24,#a3e635)"
                : "linear-gradient(90deg,#a3e635,#22d3ee)",
            }}
          />
        </div>
        <button
          onClick={() => onBump(goal.id, 10)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus size={13} />
        </button>
      </div>

      <input
        value={goal.notes}
        onChange={(e) => onNotes(goal.id, e.target.value)}
        placeholder="Add a note…"
        className="mt-3 w-full rounded-lg border border-transparent bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 placeholder:text-white/25 focus:border-white/15 focus:outline-none"
      />
    </motion.div>
  );
}
