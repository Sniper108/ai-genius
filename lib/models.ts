"use client";

/**
 * Model catalog + active-model management.
 *
 * The OmniRoute agent asks for whichever model is "active" here. The catalog is
 * fully editable from the Models page — add any id from your gateway
 * (localhost:20128/v1/models) and switch between them in one click. The active
 * model is stored under the same key the OmniRoute bridge already reads, so
 * everything stays wired together.
 */

const CATALOG_KEY = "agentos.models.catalog";
const ACTIVE_KEY = "nexus.omniroute.model"; // shared with lib/omniroute.ts

export interface ModelEntry {
  id: string; // the exact model id sent to the gateway (e.g. "auto/coding:free")
  label: string; // friendly name shown in the UI
  note?: string; // one-line description
  free?: boolean; // badge it as free
}

/** Sensible starting catalog — all free/keyless via OmniRoute. */
export const DEFAULT_MODELS: ModelEntry[] = [
  { id: "auto", label: "Auto (smart pick)", note: "Let OmniRoute choose the best available model", free: true },
  { id: "auto/coding:free", label: "Free coding", note: "Free-only auto-router — never costs anything", free: true },
  { id: "aug/kimi-k2.7", label: "Kimi K2.7", note: "Moonshot's fast, capable free coder", free: true },
  { id: "auto/reasoning:free", label: "Free reasoning", note: "Free-only router tuned for harder problems", free: true },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getModels(): ModelEntry[] {
  const list = read<ModelEntry[]>(CATALOG_KEY, DEFAULT_MODELS);
  return Array.isArray(list) && list.length ? list : DEFAULT_MODELS;
}

export function saveModels(list: ModelEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATALOG_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getActiveModel(): string {
  if (typeof window === "undefined") return "auto";
  try {
    return window.localStorage.getItem(ACTIVE_KEY) || "auto";
  } catch {
    return "auto";
  }
}

export function setActiveModel(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id.trim() || "auto");
  } catch {
    /* ignore */
  }
}
