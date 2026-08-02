"use client";

const KEY = "nexus.omniroute.model";

/** The free Kimi model id on OpenRouter — a sensible one-click default. */
export const KIMI_FREE = "moonshotai/kimi-k2:free";

export function getOmniModel(): string {
  if (typeof window === "undefined") return "auto";
  try {
    return window.localStorage.getItem(KEY) || "auto";
  } catch {
    return "auto";
  }
}

export function setOmniModel(model: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, model.trim() || "auto");
  } catch {
    /* ignore */
  }
}
