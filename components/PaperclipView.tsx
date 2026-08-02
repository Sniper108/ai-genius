"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, ExternalLink, RefreshCw, Building2 } from "lucide-react";

const PAPERCLIP_URL = "http://localhost:3100";

export function PaperclipView() {
  const [reachable, setReachable] = useState<boolean | null>(null);

  const check = async () => {
    try {
      const res = await fetch("/api/paperclip", { cache: "no-store" });
      const data = await res.json();
      setReachable(!!data.reachable);
    } catch {
      setReachable(false);
    }
  };

  useEffect(() => {
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-black/20 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-glow shadow-electric/40">
            <Paperclip size={18} className="text-white" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-[15px] font-semibold">
              Paperclip
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  reachable ? "bg-lime/15 text-lime" : "bg-white/5 text-white/40"
                }`}
              >
                {reachable == null ? "…" : reachable ? "RUNNING" : "NOT RUNNING"}
              </span>
            </h1>
            <p className="text-xs text-white/40">Run an AI company · localhost:3100</p>
          </div>
        </div>
        <a
          href={PAPERCLIP_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-all hover:text-white"
        >
          <ExternalLink size={13} /> Open full Paperclip
        </a>
      </header>

      {/* Body */}
      <div className="relative flex-1">
        {reachable ? (
          <iframe
            src={PAPERCLIP_URL}
            title="Paperclip"
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <NotRunning onRecheck={check} loading={reachable == null} />
        )}
      </div>
    </div>
  );
}

function NotRunning({ onRecheck, loading }: { onRecheck: () => void; loading: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-24 text-center"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-glow-lg shadow-electric/40">
        <Building2 size={30} className="text-white" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">
        {loading ? "Checking for Paperclip…" : "Paperclip isn't running yet"}
      </h2>
      <p className="mt-1 text-sm text-white/45">
        Paperclip is a separate local app (your AI company). Start it in a terminal, then this tab
        shows it live.
      </p>
      <div className="mono mt-5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white/80">
        npx paperclipai onboard --yes
      </div>
      <p className="mt-2 text-[11px] text-white/35">
        Leave that terminal open — it serves Paperclip at localhost:3100. This tab re-checks every
        few seconds.
      </p>
      <button
        onClick={onRecheck}
        className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-br from-electric to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-glow shadow-electric/30 transition-transform hover:scale-105"
      >
        <RefreshCw size={15} /> Check again
      </button>
    </motion.div>
  );
}
