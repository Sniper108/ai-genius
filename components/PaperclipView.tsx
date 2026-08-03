"use client";

import { useEffect, useState } from "react";
import { Paperclip, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";

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
    const t = setInterval(check, 6000);
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
                  reachable ? "bg-lime/15 text-lime" : reachable === false ? "bg-amber/15 text-amber" : "bg-white/5 text-white/40"
                }`}
              >
                {reachable == null ? "…" : reachable ? "RUNNING" : "NOT DETECTED"}
              </span>
            </h1>
            <p className="text-xs text-white/40">Run an AI company · localhost:3100</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={check}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 transition-all hover:text-white"
          >
            <RefreshCw size={13} /> Recheck
          </button>
          <a
            href={PAPERCLIP_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-electric to-cyan px-3 py-1.5 text-xs font-semibold text-white shadow-glow shadow-electric/30 transition-transform hover:scale-105"
          >
            <ExternalLink size={13} /> Open full Paperclip
          </a>
        </div>
      </header>

      {/* Banner shown only when we can't detect Paperclip — but the embed below
          still renders, so a browser-reachable Paperclip always shows. */}
      {reachable === false && (
        <div className="flex items-center gap-2 border-b border-amber/20 bg-amber/[0.06] px-5 py-2 text-xs text-amber/90">
          <AlertTriangle size={14} className="shrink-0" />
          <span>
            Can&apos;t detect Paperclip. If the area below is blank, start it in a terminal:{" "}
            <span className="mono text-amber">npx paperclipai onboard --yes</span> — and keep that
            window open. Some builds also block embedding; if so, use{" "}
            <span className="font-semibold">Open full Paperclip</span>.
          </span>
        </div>
      )}

      {/* The embed always renders — the browser reaches localhost:3100 directly. */}
      <div className="relative flex-1 bg-white">
        <iframe src={PAPERCLIP_URL} title="Paperclip" className="h-full w-full border-0" />
      </div>
    </div>
  );
}
