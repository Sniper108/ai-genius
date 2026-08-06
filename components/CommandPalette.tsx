"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Columns3,
  Target,
  Cpu,
  Wallet,
  Radar,
  Globe,
  NotebookPen,
  Paperclip,
  Settings2,
  Search,
  CornerDownLeft,
} from "lucide-react";
import { AGENTS } from "@/lib/agents";

interface Cmd {
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ReactNode;
  keywords?: string;
}

const NAV: Cmd[] = [
  { label: "Mission Control", href: "/", icon: <LayoutDashboard size={16} />, keywords: "home dashboard" },
  { label: "Boardroom", href: "/boardroom", icon: <Users size={16} />, keywords: "ask all agents compare" },
  { label: "Board", href: "/board", icon: <Columns3 size={16} />, keywords: "kanban tasks operations" },
  { label: "Goals", href: "/goals", icon: <Target size={16} />, keywords: "targets growth objectives" },
  { label: "Radar", href: "/radar", icon: <Radar size={16} />, keywords: "trends ideas hooks products research" },
  { label: "Reach", href: "/reach", icon: <Globe size={16} />, keywords: "read url web page scrape search content" },
  { label: "Models", href: "/models", icon: <Cpu size={16} />, keywords: "llm model switch add" },
  { label: "Usage", href: "/usage", icon: <Wallet size={16} />, keywords: "cost spend credits budget" },
  { label: "Journal", href: "/journal", icon: <NotebookPen size={16} />, keywords: "notes log" },
  { label: "Paperclip", href: "/paperclip", icon: <Paperclip size={16} />, keywords: "ai company agents" },
  { label: "Settings", href: "/settings", icon: <Settings2 size={16} />, keywords: "vault config" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);

  const commands = useMemo<Cmd[]>(() => {
    const agentCmds: Cmd[] = AGENTS.map((a) => ({
      label: a.name,
      sublabel: a.tagline,
      href: `/agents/${a.id}`,
      icon: (
        <span
          className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundImage: `linear-gradient(135deg, ${a.gradient[0]}, ${a.gradient[1]})` }}
        >
          {a.name[0]}
        </span>
      ),
      keywords: `agent chat ${a.tagline}`,
    }));
    return [...NAV, ...agentCmds];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.sublabel ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, commands]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setSel(0);
  }, [query, open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d16]/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
            <Search size={17} className="text-white/40" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSel((s) => Math.min(filtered.length - 1, s + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSel((s) => Math.max(0, s - 1));
                } else if (e.key === "Enter" && filtered[sel]) {
                  e.preventDefault();
                  go(filtered[sel].href);
                }
              }}
              placeholder="Jump to an agent or page…"
              className="flex-1 bg-transparent py-4 text-sm text-white placeholder:text-white/30 focus:outline-none"
            />
            <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 sm:block">
              ESC
            </kbd>
          </div>
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-white/30">No matches.</p>
            ) : (
              filtered.map((c, i) => (
                <button
                  key={c.href}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(c.href)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === sel ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60">
                    {c.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.label}</span>
                    {c.sublabel && (
                      <span className="block truncate text-[11px] text-white/35">{c.sublabel}</span>
                    )}
                  </span>
                  {i === sel && <CornerDownLeft size={14} className="shrink-0 text-white/30" />}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
