"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Terminal, Radio } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { useFleetStatus } from "@/lib/useFleetStatus";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SystemVitals } from "@/components/SystemVitals";
import { AgentCard } from "@/components/AgentCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { GrowthCockpit } from "@/components/GrowthCockpit";

export default function DashboardPage() {
  const statuses = useFleetStatus();
  const online = AGENTS.filter(
    (a) => (statuses[a.id] ?? a.defaultStatus) === "online",
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <DashboardHeader />

      {/* Fleet summary strip */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-6"
      >
        <SystemVitals />
      </motion.div>

      {/* Growth cockpit: quick actions + today snapshot */}
      <GrowthCockpit />

      {/* Fleet status + jump into Claude */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass mt-6 flex flex-col items-start justify-between gap-4 overflow-hidden p-5 sm:flex-row sm:items-center"
      >
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-claude/30 blur-3xl" />
        <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">
          <Radio size={16} className="text-lime" />
          {online} of {AGENTS.length} agents online
        </div>
        <Link
          href="/agents/claude"
          className="relative flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-electric to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-glow shadow-electric/40 transition-transform hover:scale-105 active:scale-95"
        >
          <Terminal size={16} />
          Chat with Claude
        </Link>
      </motion.div>

      {/* Agent fleet grid + activity feed */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Agent Fleet</h2>
            <span className="mono text-xs text-white/35">{AGENTS.length} registered</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {AGENTS.map((agent, i) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                status={statuses[agent.id] ?? agent.defaultStatus}
                index={i}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <ActivityFeed />
        </div>
      </div>

      <footer className="mono mt-12 pb-8 text-center text-[11px] text-white/25">
        Agent OS · local mission control · bridged to your Claude Code CLI
      </footer>
    </div>
  );
}
