"use client";

import { useEffect, useState } from "react";
import type { AgentStatus } from "./types";

/** Polls /api/agents and returns a map of agentId -> status. */
export function useFleetStatus(intervalMs = 6000): Record<string, AgentStatus> {
  const [statuses, setStatuses] = useState<Record<string, AgentStatus>>({});

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/agents", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        const map: Record<string, AgentStatus> = {};
        for (const s of data.statuses ?? []) map[s.id] = s.status;
        setStatuses(map);
      } catch {
        /* keep last known */
      }
    };
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [intervalMs]);

  return statuses;
}
