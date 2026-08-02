"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";

interface Event {
  id: number;
  agent: string;
  accent: string;
  text: string;
  time: string;
}

const TEMPLATES = [
  "completed a task run",
  "synced session state",
  "picked up a new job",
  "streamed 1.2k tokens",
  "ran a tool call",
  "went idle after 3 tasks",
  "checked in with the bridge",
  "queued a scheduled run",
  "resolved a workflow step",
];

let counter = 0;

/**
 * A living activity feed. In a real deployment these events would arrive from
 * each agent's webhook; here we synthesize a plausible heartbeat so the OS
 * always feels alive.
 */
export function ActivityFeed() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const push = () => {
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const text = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      const now = new Date();
      setEvents((prev) =>
        [
          {
            id: counter++,
            agent: agent.name,
            accent: agent.accent,
            text,
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev,
        ].slice(0, 8),
      );
    };
    push();
    const t = setInterval(push, 3200 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="glass h-full p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold">Live Activity</h3>
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-lime">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-lime" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime" />
          </span>
          Streaming
        </span>
      </div>
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {events.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: -12, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: e.accent, boxShadow: `0 0 8px ${e.accent}` }}
              />
              <p className="flex-1 truncate text-xs text-white/60">
                <span className="font-semibold text-white/85">{e.agent}</span> {e.text}
              </p>
              <span className="mono shrink-0 text-[10px] text-white/30">{e.time}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
