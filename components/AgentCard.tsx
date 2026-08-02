"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { AgentDef, AgentStatus } from "@/lib/types";
import { Icon } from "./Icon";
import { StatusDot } from "./StatusDot";

export function AgentCard({
  agent,
  status,
  index,
}: {
  agent: AgentDef;
  status: AgentStatus;
  index: number;
}) {
  const href = agent.kind === "claude" ? "/claude" : `/agents/${agent.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 120, damping: 18 }}
    >
      <Link
        href={href}
        className="group glass glass-hover relative block overflow-hidden p-5"
        style={{ ["--tw-shadow-color" as string]: agent.accent }}
      >
        {/* Accent glow that intensifies on hover */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
          style={{ backgroundColor: agent.accent }}
        />

        <div className="relative flex items-start justify-between">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${agent.accent}20`, boxShadow: `0 0 24px -6px ${agent.accent}` }}
          >
            <Icon name={agent.icon} size={22} className="text-white" />
          </div>
          <StatusDot status={status} showLabel />
        </div>

        <div className="relative mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{agent.name}</h3>
            {agent.kind === "claude" && (
              <span className="chip !text-[10px]" style={{ color: agent.accent }}>
                PRIME
              </span>
            )}
          </div>
          <p className="text-sm text-white/45">{agent.tagline}</p>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-1.5">
          {agent.capabilities.slice(0, 3).map((c) => (
            <span key={c} className="chip !text-[10px] !text-white/50">
              {c}
            </span>
          ))}
        </div>

        <div className="relative mt-4 flex items-center gap-1 text-sm font-medium text-white/50 transition-colors group-hover:text-white">
          <span style={{ color: agent.accent }}>Open console</span>
          <ArrowUpRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: agent.accent }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
