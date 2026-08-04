"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, Loader2, Sparkles, Globe, ChevronDown, Trash2, AlertTriangle } from "lucide-react";
import { getActiveModel } from "@/lib/models";

interface Scan {
  ts: number;
  niche: string;
  source: "omniroute" | "claude";
  content: string;
}

const KEY = "agentos.radar";
const DEFAULT_NICHE = "Women's fashion ecommerce — Lin Marine Paris (linmarineparis.fr)";

function buildPrompt(niche: string): string {
  return `You are a sharp ecommerce growth strategist for a Shopify store.
Niche: ${niche}.

Give me a punchy, scannable daily brief in markdown with these sections:

### 🔥 3 products to test today
For each: the product, why it could win right now, and the target buyer.

### 🎯 5 content hooks
Short scroll-stopping hooks (for Meta/TikTok ads or organic) I can use this week.

### 📈 3 trend angles
Emerging angles, aesthetics, or seasonal moments worth riding in this niche.

Be specific and practical. No preamble, no disclaimers — just the brief.`;
}

export function RadarView() {
  const [niche, setNiche] = useState(DEFAULT_NICHE);
  const [source, setSource] = useState<"omniroute" | "claude">("omniroute");
  const [scanning, setScanning] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<Scan[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const persist = (list: Scan[]) => {
    setHistory(list);
    try {
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 40)));
    } catch {
      /* ignore */
    }
  };

  const scan = async () => {
    if (scanning) {
      abortRef.current?.abort();
      return;
    }
    setScanning(true);
    setOutput("");
    setError("");
    const ac = new AbortController();
    abortRef.current = ac;
    const endpoint = source === "claude" ? "/api/claude" : "/api/omniroute";
    const body =
      source === "claude"
        ? { prompt: buildPrompt(niche) }
        : { prompt: buildPrompt(niche), model: getActiveModel() };
    let acc = "";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          try {
            const evt = JSON.parse(t.slice(5).trim());
            if (evt.kind === "text") {
              acc += evt.text;
              setOutput((o) => o + evt.text);
            } else if (evt.kind === "error") {
              setError(evt.message || "Scan error");
            }
          } catch {
            /* ignore */
          }
        }
      }
      if (acc.trim()) {
        persist([{ ts: Date.now(), niche, source, content: acc.trim() }, ...history]);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setError(err?.message ?? "Scan failed");
    } finally {
      setScanning(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Radar size={22} className="text-electric" /> Radar
        </h1>
        <p className="mt-1 text-sm text-white/45">
          A daily brief of products to test, content hooks, and trend angles for your niche.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 p-5"
      >
        <label className="text-xs font-medium uppercase tracking-wider text-white/40">Niche / focus</label>
        <textarea
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => setSource("omniroute")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                source === "omniroute" ? "bg-teal-400 text-black" : "text-white/50 hover:text-white"
              }`}
            >
              <Sparkles size={13} /> Free ideas
            </button>
            <button
              onClick={() => setSource("claude")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                source === "claude" ? "bg-claude text-black" : "text-white/50 hover:text-white"
              }`}
            >
              <Globe size={13} /> Live web (Claude)
            </button>
          </div>
          <button
            onClick={scan}
            className="ml-auto flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-electric to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-glow shadow-electric/30 transition-transform hover:scale-105 active:scale-95"
          >
            {scanning ? <Loader2 size={15} className="animate-spin" /> : <Radar size={15} />}
            {scanning ? "Stop" : "Scan now"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          {source === "omniroute"
            ? "Free ideas: brainstormed by your active free model (no live web) — fast, $0."
            : "Live web: Claude searches the web for current trends — costs Claude credits, but real-time."}
        </p>
      </motion.div>

      {/* Live output */}
      {(output || error || scanning) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass mt-6 p-5">
          {error ? (
            <div className="flex items-start gap-2 text-sm text-rose">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-white/85">
              {output || <span className="text-white/30">Scanning…</span>}
            </pre>
          )}
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Recent scans</h2>
            <button
              onClick={() => {
                if (confirm("Clear scan history?")) persist([]);
              }}
              className="flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-rose"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {history.map((s) => (
                <motion.div
                  key={s.ts}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <button
                    onClick={() => setOpenId(openId === s.ts ? null : s.ts)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      className="rounded px-1.5 py-px text-[9px] font-bold"
                      style={
                        s.source === "claude"
                          ? { backgroundColor: "#ff7a4522", color: "#ff7a45" }
                          : { backgroundColor: "#2dd4bf22", color: "#2dd4bf" }
                      }
                    >
                      {s.source === "claude" ? "LIVE" : "FREE"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{s.niche}</span>
                      <span className="text-[11px] text-white/35">
                        {new Date(s.ts).toLocaleString()}
                      </span>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-white/40 transition-transform ${openId === s.ts ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openId === s.ts && (
                    <pre className="whitespace-pre-wrap break-words border-t border-white/[0.06] px-4 py-3 font-sans text-sm text-white/80">
                      {s.content}
                    </pre>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
