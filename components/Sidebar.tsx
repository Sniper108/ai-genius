"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import { Icon } from "./Icon";
import { StatusDot } from "./StatusDot";
import { useFleetStatus } from "@/lib/useFleetStatus";

export function Sidebar() {
  const pathname = usePathname();
  const statuses = useFleetStatus();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[248px] flex-col border-r border-white/10 bg-black/40 backdrop-blur-2xl md:flex">
      {/* Brand */}
      <Link href="/" className="group flex items-center gap-3 px-6 py-6">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-cyan shadow-glow shadow-electric/50">
          <Icon name="Zap" size={20} className="text-white" />
          <span className="absolute inset-0 animate-pulse-ring rounded-xl bg-electric/40" />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-tight text-gradient">NEXUS</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">
            Mission Control
          </div>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        <NavItem href="/" icon="LayoutDashboard" label="Mission Control" active={isActive("/")} />
        <NavItem href="/claude" icon="Terminal" label="Claude Console" active={isActive("/claude")} />

        <div className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
          Agent Fleet
        </div>

        {AGENTS.map((agent) => {
          const href = agent.kind === "claude" ? "/claude" : `/agents/${agent.id}`;
          const status = statuses[agent.id] ?? agent.defaultStatus;
          return (
            <Link
              key={agent.id}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                isActive(href) && agent.kind !== "claude"
                  ? "bg-white/[0.06] text-white"
                  : "text-white/60 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10"
                style={{ backgroundColor: `${agent.accent}18` }}
              >
                <Icon name={agent.icon} size={15} className="text-white" />
              </span>
              <span className="flex-1 font-medium">{agent.name}</span>
              <StatusDot status={status} />
            </Link>
          );
        })}
      </nav>

      <SidebarFooter />
    </aside>
  );
}

function NavItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        active ? "text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.06]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative flex h-8 w-8 items-center justify-center">
        <Icon name={icon} size={17} />
      </span>
      <span className="relative">{label}</span>
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <div className="flex items-center gap-2 text-xs text-white/40">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-lime" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
        </span>
        Bridge connected · localhost
      </div>
    </div>
  );
}
