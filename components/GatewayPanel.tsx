"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Power, Radio, Terminal, Info } from "lucide-react";
import { getAgent } from "@/lib/agents";
import { AgentAvatar } from "./Avatar";

interface Status {
  running: boolean;
  pid: number | null;
  startedAt: number | null;
  logs: string[];
}

const hermes = getAgent("hermes")!;

function uptime(startedAt: number | null): string {
  if (!startedAt) return "—";
  const s = Math.floor((Date.now() - startedAt) / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function GatewayPanel() {
  const [status, setStatus] = useState<Status>({ running: false, pid: null, startedAt: null, logs: [] });
  const [pending, setPending] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const refresh = async () => {
    try {
      const res = await fetch("/api/hermes/gateway", { cache: "no-store" });
      setStatus(await res.json());
    } catch {
      /* keep last known */
    }
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [status.logs]);

  const toggle = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/hermes/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: status.running ? "stop" : "start" }),
      });
      setStatus(await res.json());
    } catch {
      /* ignore */
    } finally {
      setPending(false);
      setTimeout(refresh, 600);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
      <Link
        href="/agents/hermes"
        className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white"
      >
        <ArrowLeft size={15} /> Back to Hermes
      </Link>

      {/* Header + toggle */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass mt-4 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center"
      >
        <div className="flex items-center gap-4">
          <AgentAvatar agent={hermes} size={52} glow />
          <div>
            <h1 className="text-xl font-bold">Hermes Gateway</h1>
            <p className="text-sm text-white/45">
              Bridges Hermes to your messaging platforms (Discord, Telegram, email…).
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  {status.running && (
                    <span
                      className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full"
                      style={{ backgroundColor: hermes.accent }}
                    />
                  )}
                  <span
                    className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: status.running ? hermes.accent : "#64748b",
                      boxShadow: status.running ? `0 0 10px ${hermes.accent}` : undefined,
                    }}
                  />
                </span>
                <span className="font-medium" style={{ color: status.running ? hermes.accent : "#94a3b8" }}>
                  {status.running ? "Running" : "Stopped"}
                </span>
              </span>
              {status.running && (
                <>
                  <span className="mono text-white/35">pid {status.pid}</span>
                  <span className="mono text-white/35">up {uptime(status.startedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={pending}
          className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            backgroundImage: status.running
              ? "linear-gradient(135deg, #fb7185, #ef4444)"
              : `linear-gradient(135deg, ${hermes.gradient[0]}, ${hermes.gradient[1]})`,
          }}
        >
          <Power size={16} />
          {pending ? "Working…" : status.running ? "Stop gateway" : "Start gateway"}
        </button>
      </motion.div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <div className="glass p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <Radio size={15} style={{ color: hermes.accent }} /> What this does
            </h3>
            <p className="text-sm leading-relaxed text-white/55">
              Runs <span className="mono text-white/70">hermes gateway</span> on your machine. Once
              live, Hermes can receive and reply to messages on the platforms you configured — so you
              can talk to it from Discord or Telegram, not just here.
            </p>
          </div>

          <div className="glass p-5">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold">
              <Info size={15} className="text-amber" /> Before it works
            </h3>
            <p className="text-sm leading-relaxed text-white/55">
              A platform must be fully configured in Hermes first. To finish Discord (or add
              Telegram), run{" "}
              <span className="mono text-white/70">hermes setup</span> in a terminal and complete the
              messaging step. The gateway will start regardless, but only configured platforms will
              actually connect.
            </p>
          </div>
        </motion.div>

        {/* Live logs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass flex h-[28rem] flex-col p-5 lg:col-span-2"
        >
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Terminal size={15} style={{ color: hermes.accent }} /> Gateway logs
          </h3>
          <div
            ref={logRef}
            className="mono flex-1 space-y-0.5 overflow-y-auto rounded-xl bg-black/40 p-4 text-[11px] leading-relaxed"
          >
            {status.logs.length === 0 ? (
              <p className="text-white/30">
                No output yet. Press <span className="text-white/50">Start gateway</span> to launch it.
              </p>
            ) : (
              status.logs.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.includes("[error]")
                      ? "text-rose"
                      : line.includes("[nexus]")
                      ? "text-white/40"
                      : "text-white/70"
                  }
                >
                  {line}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
