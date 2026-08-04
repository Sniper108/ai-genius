"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Radar, Columns3, Target, Users, ArrowRight, Wallet } from "lucide-react";
import { getUsage, startOfToday } from "@/lib/usage";

interface Goal {
  id: string;
  title: string;
  progress: number;
  done: boolean;
}

const ACTIONS = [
  {
    href: "/radar",
    icon: Radar,
    title: "Scan trends",
    desc: "Today's products, hooks & angles",
    grad: ["#7c5cff", "#22d3ee"] as [string, string],
  },
  {
    href: "/board",
    icon: Columns3,
    title: "Product tests",
    desc: "Track your test pipeline",
    grad: ["#22d3ee", "#3b82f6"] as [string, string],
  },
  {
    href: "/goals",
    icon: Target,
    title: "Goals",
    desc: "Your growth targets",
    grad: ["#a3e635", "#22c55e"] as [string, string],
  },
  {
    href: "/boardroom",
    icon: Users,
    title: "Ask the room",
    desc: "All agents, one question",
    grad: ["#ff8a4c", "#ff5f6d"] as [string, string],
  },
];

export function GrowthCockpit() {
  const [todaySpend, setTodaySpend] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const refresh = () => {
      const today = startOfToday();
      setTodaySpend(getUsage().filter((r) => r.ts >= today).reduce((s, r) => s + r.costUsd, 0));
      try {
        const raw = localStorage.getItem("agentos.goals");
        setGoals(raw ? JSON.parse(raw) : []);
      } catch {
        setGoals([]);
      }
    };
    refresh();
    window.addEventListener("agentos-usage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("agentos-usage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const activeGoals = goals.filter((g) => !g.done);
  const topGoal = activeGoals[0];

  return (
    <div className="mt-6 space-y-6">
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map((a, i) => (
          <motion.div
            key={a.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.04 }}
          >
            <Link
              href={a.href}
              className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                style={{ backgroundImage: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})` }}
              />
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundImage: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})` }}
              >
                <a.icon size={19} />
              </span>
              <div className="relative mt-4">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  {a.title}
                  <ArrowRight
                    size={13}
                    className="opacity-0 transition-all -translate-x-1 group-hover:translate-x-0 group-hover:opacity-60"
                  />
                </div>
                <div className="text-[11px] text-white/40">{a.desc}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Today strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      >
        {/* Today's spend */}
        <Link href="/usage" className="glass glass-hover flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/15 text-amber">
            <Wallet size={18} />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40">Spent today</div>
            <div className="text-lg font-bold">${todaySpend.toFixed(4)}</div>
          </div>
        </Link>

        {/* Active goals count */}
        <Link href="/goals" className="glass glass-hover flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime/15 text-lime">
            <Target size={18} />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-white/40">Active goals</div>
            <div className="text-lg font-bold">{activeGoals.length}</div>
          </div>
        </Link>

        {/* Top goal progress */}
        <Link href="/goals" className="glass glass-hover flex flex-col justify-center gap-1.5 p-4">
          {topGoal ? (
            <>
              <div className="truncate text-xs font-medium text-white/70">{topGoal.title}</div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${topGoal.progress}%`,
                    backgroundImage: "linear-gradient(90deg,#a3e635,#22d3ee)",
                  }}
                />
              </div>
              <div className="text-[10px] text-white/35">{topGoal.progress}% · top goal</div>
            </>
          ) : (
            <div className="text-xs text-white/35">Set a growth goal →</div>
          )}
        </Link>
      </motion.div>
    </div>
  );
}
