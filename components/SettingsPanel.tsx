"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Check, X, Save, BookText, Route } from "lucide-react";
import { getVaultConfig, setVaultConfig, verifyVault } from "@/lib/vault";
import { getOmniModel, setOmniModel, KIMI_FREE } from "@/lib/omniroute";

export function SettingsPanel() {
  const [path, setPath] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState<null | { exists: boolean; folder: string | null }>(null);
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [omniModel, setOmniModelInput] = useState("auto");

  useEffect(() => {
    const cfg = getVaultConfig();
    setPath(cfg.path);
    setEnabled(cfg.enabled);
    setOmniModelInput(getOmniModel());
  }, []);

  const verify = async (p: string) => {
    if (!p.trim()) return setStatus(null);
    setChecking(true);
    setStatus(await verifyVault(p.trim()));
    setChecking(false);
  };

  const save = async () => {
    setVaultConfig({ path: path.trim(), enabled });
    setOmniModel(omniModel);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
    verify(path);
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/45">Connect your Obsidian vault and control auto-logging.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass mt-6 p-6"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <BookText size={16} className="text-electric" /> Obsidian Vault
        </h2>
        <p className="mt-1 text-sm text-white/45">
          Chats, goals, and journal entries are appended to{" "}
          <span className="mono text-white/60">&lt;vault&gt;\Agentic OS\YYYY-MM-DD.md</span> — one
          file per day.
        </p>

        <label className="mt-5 block text-xs font-medium uppercase tracking-wider text-white/40">
          Vault folder path
        </label>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 focus-within:border-white/20">
            <FolderOpen size={16} className="shrink-0 text-white/40" />
            <input
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setStatus(null);
              }}
              onBlur={() => verify(path)}
              placeholder="D:\My Vault"
              className="mono flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <button
            onClick={() => verify(path)}
            disabled={checking || !path.trim()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/60 transition-all hover:text-white disabled:opacity-40"
          >
            {checking ? "Checking…" : "Verify"}
          </button>
        </div>

        {status && (
          <div
            className={`mt-2 flex items-center gap-2 text-xs ${status.exists ? "text-lime" : "text-rose"}`}
          >
            {status.exists ? <Check size={13} /> : <X size={13} />}
            {status.exists ? (
              <span>
                Folder found — notes will be written to{" "}
                <span className="mono text-white/60">{status.folder}</span>
              </span>
            ) : (
              <span>That folder doesn&apos;t exist. Double-check the path.</span>
            )}
          </div>
        )}

        <label className="mt-6 flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <span className="text-sm">
            <span className="font-medium">Auto-save chats</span>
            <span className="block text-xs text-white/40">
              Append every Claude &amp; Hermes exchange to today&apos;s note.
            </span>
          </span>
          <button
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-lime/80" : "bg-white/15"}`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-[22px]" : "translate-x-0.5"}`}
            />
          </button>
        </label>

        {/* OmniRoute model */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Route size={16} style={{ color: "#2dd4bf" }} /> OmniRoute model
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Which model the OmniRoute agent asks for. Use{" "}
            <span className="mono text-white/60">auto</span> to let OmniRoute choose, or pin a
            specific free model like Kimi.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={omniModel}
              onChange={(e) => setOmniModelInput(e.target.value)}
              placeholder="auto"
              className="mono flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-white/20 focus:outline-none"
            />
            <button
              onClick={() => setOmniModelInput(KIMI_FREE)}
              className="shrink-0 rounded-xl border border-teal-400/40 bg-teal-400/10 px-3 py-2.5 text-xs font-medium text-teal-300 transition-all hover:bg-teal-400/20"
            >
              Use Kimi (free)
            </button>
            <button
              onClick={() => setOmniModelInput("auto")}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/60 transition-all hover:text-white"
            >
              Auto
            </button>
          </div>
          <p className="mono mt-2 text-[11px] text-white/30">
            Kimi needs to be reachable through a provider you&apos;ve connected in OmniRoute (e.g.
            OpenRouter&apos;s {KIMI_FREE}).
          </p>
        </div>

        <button
          onClick={save}
          className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-to-br from-electric to-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-glow shadow-electric/30 transition-transform hover:scale-105 active:scale-95"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? "Saved" : "Save settings"}
        </button>

        <p className="mono mt-4 text-[11px] leading-relaxed text-white/30">
          Tip: your vault is the folder Obsidian opens. From your screenshot that&apos;s{" "}
          <span className="text-white/50">D:\My Vault</span>. Everything stays on your machine.
        </p>
      </motion.div>
    </div>
  );
}
