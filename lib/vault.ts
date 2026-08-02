"use client";

export interface VaultConfig {
  path: string;
  enabled: boolean;
}

const KEY = "nexus.vault";

export function getVaultConfig(): VaultConfig {
  if (typeof window === "undefined") return { path: "", enabled: true };
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { path: "", enabled: true, ...JSON.parse(raw) } : { path: "", enabled: true };
  } catch {
    return { path: "", enabled: true };
  }
}

export function setVaultConfig(cfg: VaultConfig) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cfg));
  } catch {
    /* ignore */
  }
}

const pad = (n: number) => String(n).padStart(2, "0");

export function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/**
 * Append an entry to today's Obsidian daily note. No-op (never throws) when the
 * vault isn't configured or auto-save is off, so callers can fire-and-forget.
 */
export async function saveToVault(heading: string, body: string): Promise<{ ok?: boolean; skipped?: boolean; error?: string }> {
  const cfg = getVaultConfig();
  if (!cfg.enabled || !cfg.path) return { skipped: true };
  const { date, time } = nowParts();
  try {
    const res = await fetch("/api/vault", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultPath: cfg.path, date, time, heading, body }),
    });
    return await res.json();
  } catch (e: any) {
    return { error: String(e?.message ?? e) };
  }
}

export async function verifyVault(pathStr: string): Promise<{ exists: boolean; folder: string | null }> {
  try {
    const res = await fetch(`/api/vault?verify=1&vaultPath=${encodeURIComponent(pathStr)}`, {
      cache: "no-store",
    });
    return await res.json();
  } catch {
    return { exists: false, folder: null };
  }
}

export async function readTodayNote(): Promise<string> {
  const cfg = getVaultConfig();
  if (!cfg.path) return "";
  const { date } = nowParts();
  try {
    const res = await fetch(
      `/api/vault?vaultPath=${encodeURIComponent(cfg.path)}&date=${date}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    return data.content ?? "";
  } catch {
    return "";
  }
}
