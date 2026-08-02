"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, MemoryStick, Server, Clock } from "lucide-react";

interface Vitals {
  hostname: string;
  platform: string;
  uptimeSec: number;
  cores: number;
  cpuPct: number;
  loadAvg: number[];
  mem: { totalGb: number; usedGb: number; pct: number };
}

function fmtUptime(sec: number) {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SystemVitals() {
  const [v, setV] = useState<Vitals | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/system", { cache: "no-store" });
        const data = await res.json();
        if (alive) setV(data);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Gauge
        icon={<Cpu size={16} />}
        label="CPU Load"
        value={v ? `${v.cpuPct}%` : "—"}
        pct={v?.cpuPct ?? 0}
        accent="#7c5cff"
        sub={v ? `${v.cores} cores` : ""}
      />
      <Gauge
        icon={<MemoryStick size={16} />}
        label="Memory"
        value={v ? `${v.mem.pct}%` : "—"}
        pct={v?.mem.pct ?? 0}
        accent="#22d3ee"
        sub={v ? `${v.mem.usedGb} / ${v.mem.totalGb} GB` : ""}
      />
      <Stat
        icon={<Clock size={16} />}
        label="Uptime"
        value={v ? fmtUptime(v.uptimeSec) : "—"}
        accent="#a3e635"
        sub={v ? `load ${v.loadAvg[0]}` : ""}
      />
      <Stat
        icon={<Server size={16} />}
        label="Host"
        value={v ? v.hostname.slice(0, 12) : "—"}
        accent="#ff7a45"
        sub={v ? v.platform : ""}
      />
    </div>
  );
}

function Gauge({
  icon,
  label,
  value,
  pct,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  pct: number;
  accent: string;
  sub: string;
}) {
  return (
    <div className="glass glass-hover overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-medium text-white/50">
          <span style={{ color: accent }}>{icon}</span>
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: accent, boxShadow: `0 0 12px ${accent}` }}
          animate={{ width: `${Math.min(100, pct)}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="mono mt-2 text-[10px] text-white/35">{sub}</div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
  sub: string;
}) {
  return (
    <div className="glass glass-hover p-4">
      <span className="flex items-center gap-2 text-xs font-medium text-white/50">
        <span style={{ color: accent }}>{icon}</span>
        {label}
      </span>
      <div className="mt-2 truncate text-2xl font-bold">{value}</div>
      <div className="mono mt-[1.15rem] text-[10px] text-white/35">{sub}</div>
    </div>
  );
}
