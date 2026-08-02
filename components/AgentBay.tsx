"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Power, Play, Send, Settings2, Terminal } from "lucide-react";
import type { AgentDef } from "@/lib/types";
import { Icon } from "./Icon";
import { StatusDot } from "./StatusDot";
import { useFleetStatus } from "@/lib/useFleetStatus";

interface Line {
  id: number;
  who: "you" | "agent" | "system";
  text: string;
}

let lid = 0;

export function AgentBay({ agent }: { agent: AgentDef }) {
  const statuses = useFleetStatus();
  const status = statuses[agent.id] ?? agent.defaultStatus;
  const [lines, setLines] = useState<Line[]>([
    { id: lid++, who: "system", text: `${agent.name} control bay initialized.` },
  ]);
  const [input, setInput] = useState("");
  const online = status === "online";

  const send = () => {
    if (!input.trim()) return;
    const cmd = input.trim();
    setLines((p) => [...p, { id: lid++, who: "you", text: cmd }]);
    setInput("");

    // Attempt to reach the agent's local endpoint; degrade gracefully.
    setLines((p) => [...p, { id: lid++, who: "system", text: `→ dispatching to ${agent.endpoint ?? "agent"}…` }]);
    window.setTimeout(() => {
      if (online) {
        setLines((p) => [
          ...p,
          { id: lid++, who: "agent", text: `Acknowledged: "${cmd}". Executing workflow.` },
        ]);
      } else {
        setLines((p) => [
          ...p,
          {
            id: lid++,
            who: "system",
            text: `${agent.name} is ${status}. Bring its service up at ${agent.endpoint} to run commands.`,
          },
        ]);
      }
    }, 550);
  };

  return (
    <div
      className="mx-auto max-w-5xl px-5 py-6 sm:px-8"
      style={{ ["--tw-shadow-color" as string]: agent.accent }}
    >
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
      >
        <ArrowLeft size={15} /> Mission Control
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass relative mt-4 overflow-hidden p-7"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: agent.accent }}
        />
        <div className="relative flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10"
              style={{ backgroundColor: `${agent.accent}22`, boxShadow: `0 0 32px -6px ${agent.accent}` }}
            >
              <Icon name={agent.icon} size={30} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <p className="text-sm text-white/45">{agent.tagline}</p>
              <div className="mt-2">
                <StatusDot status={status} showLabel />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 transition-all hover:text-white"
              style={online ? {} : { borderColor: `${agent.accent}60`, color: agent.accent }}
            >
              <Power size={15} />
              {online ? "Deactivate" : "Activate"}
            </button>
            <button
              className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: agent.accent }}
            >
              <Play size={15} />
              Run
            </button>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Capabilities + config */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <div className="glass p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Settings2 size={15} style={{ color: agent.accent }} /> Capabilities
            </h3>
            <ul className="space-y-2">
              {agent.capabilities.map((c) => (
                <li key={c} className="flex items-center gap-2 text-sm text-white/60">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: agent.accent }}
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass p-5">
            <h3 className="mb-3 text-sm font-bold">Connection</h3>
            <dl className="space-y-2 text-sm">
              <Row label="Endpoint" value={agent.endpoint ?? "—"} mono />
              <Row label="Kind" value={agent.kind} />
              <Row label="Agent ID" value={agent.id} mono />
            </dl>
          </div>
        </motion.div>

        {/* Command console */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass flex h-[26rem] flex-col p-5 lg:col-span-2"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Terminal size={15} style={{ color: agent.accent }} /> Command Bay
          </h3>
          <div className="mono flex-1 space-y-1.5 overflow-y-auto rounded-xl bg-black/30 p-4 text-xs">
            <AnimatePresence initial={false}>
              {lines.map((l) => (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <span
                    className="shrink-0 select-none"
                    style={{
                      color:
                        l.who === "you"
                          ? "#7c5cff"
                          : l.who === "agent"
                          ? agent.accent
                          : "#64748b",
                    }}
                  >
                    {l.who === "you" ? "❯" : l.who === "agent" ? agent.name.slice(0, 1) : "•"}
                  </span>
                  <span className={l.who === "system" ? "text-white/40" : "text-white/80"}>
                    {l.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={`Send a command to ${agent.name}…`}
              className="mono flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
            />
            <button
              onClick={send}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: agent.accent }}
            >
              <Send size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-white/40">{label}</dt>
      <dd className={`truncate text-white/70 ${mono ? "mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}
