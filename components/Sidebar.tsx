"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Zap, NotebookPen, Settings2, Paperclip, Columns3 } from "lucide-react";
import { AGENTS } from "@/lib/agents";
import { AgentAvatar } from "./Avatar";
import { StatusDot } from "./StatusDot";
import { useFleetStatus } from "@/lib/useFleetStatus";

export function Sidebar() {
  const pathname = usePathname();
  const statuses = useFleetStatus();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-white/[0.06] bg-[#0a0b12]/80 backdrop-blur-2xl md:flex">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 px-5 py-5">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-cyan">
          <Zap size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">NEXUS</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/35">
            Mission Control
          </div>
        </div>
      </Link>

      {/* Primary links */}
      <div className="px-3">
        <NavItem
          href="/"
          active={pathname === "/"}
          icon={<LayoutDashboard size={17} />}
          label="Mission Control"
        />
        <NavItem
          href="/board"
          active={pathname === "/board"}
          icon={<Columns3 size={17} />}
          label="Board"
        />
        <NavItem
          href="/journal"
          active={pathname === "/journal"}
          icon={<NotebookPen size={17} />}
          label="Journal"
        />
        <NavItem
          href="/paperclip"
          active={pathname === "/paperclip"}
          icon={<Paperclip size={17} />}
          label="Paperclip"
        />
        <NavItem
          href="/settings"
          active={pathname === "/settings"}
          icon={<Settings2 size={17} />}
          label="Settings"
        />
      </div>

      {/* Agents list — the "contacts" of the chat app */}
      <div className="mt-5 mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
        Agents
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        {AGENTS.map((agent) => {
          const href = `/agents/${agent.id}`;
          const active = pathname === href;
          const status = statuses[agent.id] ?? agent.defaultStatus;
          return (
            <Link
              key={agent.id}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${
                active ? "text-white" : "text-white/70 hover:text-white"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="agent-active"
                  className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.06]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">
                <AgentAvatar agent={agent} size={36} />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-medium">{agent.name}</span>
                  {(agent.kind === "claude" || agent.bridge) && (
                    <span
                      className="rounded px-1 py-px text-[8px] font-bold"
                      style={{ backgroundColor: `${agent.accent}22`, color: agent.accent }}
                    >
                      LIVE
                    </span>
                  )}
                </span>
                <span className="block truncate text-[11px] text-white/35">{agent.tagline}</span>
              </span>
              <span className="relative">
                <StatusDot status={status} />
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-lime" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
          </span>
          Bridge connected · localhost
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? "text-white" : "text-white/70 hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="agent-active"
          className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.06]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative flex h-9 w-9 items-center justify-center">{icon}</span>
      <span className="relative">{label}</span>
    </Link>
  );
}
