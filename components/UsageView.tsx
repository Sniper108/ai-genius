"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Activity, Clock, Trash2, TrendingUp } from "lucide-react";
import { getUsage, clearUsage, startOfToday, type UsageRecord } from "@/lib/usage";
import { AGENTS } from "@/lib/agents";

function accentFor(agent: string): string {
  const a = AGENTS.find((x) => x.name.toLowerCase() === agent.toLowerCase());
  return a?.accent ?? "#7c5cff";
}

export function UsageView() {
  const [records, setRecords] = useState<UsageRecord[]>([]);

  useEffect(() => {
    const refresh = () => setRecords(getUsage());
    refresh();
    window.addEventListener("agentos-usage", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("agentos-usage", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const stats = useMemo(() => {
    const totalCost = records.reduce((s, r) => s + r.costUsd, 0);
    const today = startOfToday();
    const todayCost = records.filter((r) => r.ts >= today).reduce((s, r) => s + r.costUsd, 0);
    const runs = records.length;

    const byAgent = new Map<string, { runs: number; cost: number; ms: number }>();
    for (const r of records) {
      const cur = byAgent.get(r.agent) ?? { runs: 0, cost: 0, ms: 0 };
      cur.runs += 1;
      cur.cost += r.costUsd;
      cur.ms += r.durationMs;
      byAgent.set(r.agent, cur);
    }
    const agents = [...byAgent.entries()]
      .map(([agent, v]) => ({ agent, ...v, avgMs: v.runs ? v.ms / v.runs : 0 }))
      .sort((a, b) => b.cost - a.cost || b.runs - a.runs);

    // Last 7 days cost buckets
    const days: { label: string; cost: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const from = d.getTime();
      const to = from + 86400000;
      const cost = records.filter((r) => r.ts >= from && r.ts < to).reduce((s, r) => s + r.costUsd, 0);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), cost });
    }
    const maxDay = Math.max(0.0001, ...days.map((d) => d.cost));

    return { totalCost, todayCost, runs, agents, days, maxDay };
  }, [records]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Wallet size={22} className="text-amber" /> Usage &amp; Cost
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Track spend so the Claude credit limit never surprises you. Claude reports real cost; free
            agents log activity at $0.
          </p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Clear all usage history?")) clearUsage();
            }}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/50 transition-all hover:text-rose"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </motion.div>

      {/* Stat tiles */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={<Wallet size={16} />} label="Total spend" value={`$${stats.totalCost.toFixed(4)}`} accent="#fbbf24" />
        <StatTile icon={<TrendingUp size={16} />} label="Today" value={`$${stats.todayCost.toFixed(4)}`} accent="#a3e635" />
        <StatTile icon={<Activity size={16} />} label="Total runs" value={`${stats.runs}`} accent="#22d3ee" />
      </div>

      {/* 7-day chart */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 p-5"
      >
        <h2 className="text-sm font-bold">Last 7 days · Claude cost</h2>
        <div className="mt-4 flex h-32 items-end gap-2">
          {stats.days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.cost / stats.maxDay) * 100}%` }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className="w-full rounded-t-md bg-gradient-to-t from-amber/40 to-amber"
                  style={{ minHeight: d.cost > 0 ? 4 : 0 }}
                  title={`$${d.cost.toFixed(4)}`}
                />
              </div>
              <span className="text-[10px] text-white/35">{d.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Per-agent breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6"
      >
        <h2 className="mb-3 text-sm font-bold">By agent</h2>
        {stats.agents.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 py-10 text-center text-sm text-white/30">
            No usage yet — chat with an agent and it&apos;ll show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {stats.agents.map((a) => (
              <div
                key={a.agent}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: `${accentFor(a.agent)}22`, color: accentFor(a.agent) }}
                >
                  {a.agent[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{a.agent}</div>
                  <div className="flex items-center gap-3 text-[11px] text-white/40">
                    <span className="flex items-center gap-1">
                      <Activity size={11} /> {a.runs} runs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {(a.avgMs / 1000).toFixed(1)}s avg
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mono text-sm font-semibold" style={{ color: a.cost > 0 ? "#fbbf24" : "#a3e635" }}>
                    {a.cost > 0 ? `$${a.cost.toFixed(4)}` : "FREE"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <p className="mono mt-4 text-[11px] leading-relaxed text-white/30">
        Tip: OmniRoute, Hermes and OpenClaw run free — steer heavy or repetitive work to them and save
        Claude for the hard reasoning.
      </p>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 text-xs text-white/45">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
