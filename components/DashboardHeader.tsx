"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function greeting(h: number) {
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mono text-xs uppercase tracking-[0.25em] text-white/40">
          {now ? greeting(now.getHours()) : "Welcome back"}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
          <span className="text-gradient">Mission Control</span>
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Command Claude and orchestrate your entire agent fleet from one place.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass px-5 py-3 text-right"
      >
        <div className="mono text-2xl font-bold tabular-nums tracking-tight">
          {now
            ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : "--:--:--"}
        </div>
        <div className="text-[11px] text-white/40">
          {now
            ? now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })
            : ""}
        </div>
      </motion.div>
    </div>
  );
}
