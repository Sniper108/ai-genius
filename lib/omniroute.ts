"use client";

const KEY = "nexus.omniroute.model";

/** Kimi in OmniRoute's own catalog (Kimi K2.7 Code). */
export const KIMI_MODEL = "aug/kimi-k2.7";
/** OmniRoute's free-only coding auto-router — guaranteed free. */
export const FREE_CODING = "auto/coding:free";

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
