"use client";

import { useEffect, useRef } from "react";

const PREFIX = "nexus.chat.";

/** Read a persisted chat blob for an agent (null on SSR / miss / parse error). */
export function readHistory<T = any>(key?: string): T | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Remove a persisted chat (used by the "New" button). */
export function clearHistory(key?: string) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Debounced auto-save of `data` to localStorage under `key`. Saving is gated by
 * `enabled` so we never overwrite stored history before the initial load runs.
 */
export function useAutoSave(key: string | undefined, data: unknown, enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!key || !enabled || typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(data));
      } catch {
        /* quota / serialization — ignore */
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [key, data, enabled]);
}
