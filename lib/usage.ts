"use client";

/**
 * Lightweight local usage log. Claude reports real cost/latency per run, so
 * those are exact; the free CLI agents (Hermes/OpenClaw/OmniRoute) log activity
 * (message count + latency) with $0 cost. Everything stays on your machine.
 */

const KEY = "agentos.usage";
const MAX = 2000;

export interface UsageRecord {
  ts: number;
  agent: string;
  costUsd: number;
  durationMs: number;
  turns: number;
}

export function getUsage(): UsageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UsageRecord[]) : [];
  } catch {
    return [];
  }
}

export function logUsage(rec: { agent: string; costUsd?: number; durationMs?: number; turns?: number }) {
  if (typeof window === "undefined") return;
  try {
    const list = getUsage();
    list.push({
      ts: Date.now(),
      agent: rec.agent,
      costUsd: rec.costUsd ?? 0,
      durationMs: rec.durationMs ?? 0,
      turns: rec.turns ?? 1,
    });
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
    window.dispatchEvent(new Event("agentos-usage"));
  } catch {
    /* ignore */
  }
}

export function clearUsage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("agentos-usage"));
  } catch {
    /* ignore */
  }
}

export function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
