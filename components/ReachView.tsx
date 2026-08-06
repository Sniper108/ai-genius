"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Search, Loader2, Copy, Check, AlertTriangle, Link2 } from "lucide-react";

export function ReachView() {
  const [mode, setMode] = useState<"read" | "search">("read");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const go = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setContent("");
    setError("");
    try {
      const res = await fetch("/api/reach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, input: input.trim() }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setContent(data.content || "(empty)");
    } catch (err: any) {
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Globe size={22} className="text-cyan" /> Reach
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Paste any link to get clean, readable content — or search the web. Then copy it into an
          agent as context.
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 p-5"
      >
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            onClick={() => setMode("read")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "read" ? "bg-cyan text-black" : "text-white/50 hover:text-white"
            }`}
          >
            <Link2 size={13} /> Read a page
          </button>
          <button
            onClick={() => setMode("search")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              mode === "search" ? "bg-cyan text-black" : "text-white/50 hover:text-white"
            }`}
          >
            <Search size={13} /> Search the web
          </button>
        </div>

        <div className="mt-3 flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            placeholder={
              mode === "read"
                ? "Paste a URL  ·  e.g. a competitor's product page"
                : "Search the web  ·  e.g. trending women's fashion France 2026"
            }
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
          />
          <button
            onClick={go}
            disabled={!input.trim() || loading}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-br from-cyan to-electric px-5 text-sm font-semibold text-white shadow-glow shadow-cyan/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-30"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}
            {loading ? "Reading…" : mode === "read" ? "Read" : "Search"}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/35">
          Powered by the keyless Jina reader — no API key, nothing to install. For YouTube
          transcripts, Reddit or X, ask your Claude/Codex agent (with Agent-Reach) instead.
        </p>
      </motion.div>

      {/* Result */}
      {(content || error || loading) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass mt-6 p-5">
          {error ? (
            <div className="flex items-start gap-2 text-sm text-rose">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                  {loading ? "Fetching…" : "Extracted content"}
                </span>
                {content && (
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/60 transition-all hover:text-white"
                  >
                    {copied ? <Check size={13} className="text-lime" /> : <Copy size={13} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
              <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/30 p-4 font-sans text-sm leading-relaxed text-white/80">
                {content || <span className="text-white/30">Reading the page…</span>}
              </pre>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
