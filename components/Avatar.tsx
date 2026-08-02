"use client";

import { User } from "lucide-react";
import type { AgentDef } from "@/lib/types";
import { Icon } from "./Icon";

export function Avatar({
  from,
  to,
  icon,
  size = 40,
  ring = false,
  glow = false,
  className = "",
}: {
  from: string;
  to: string;
  icon?: string;
  size?: number;
  ring?: boolean;
  glow?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
        ring ? "ring-2 ring-white/15" : ""
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: glow ? `0 0 20px -4px ${from}` : undefined,
      }}
    >
      {/* soft top highlight for a glossy, logo-like finish */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent opacity-60" />
      {icon && <Icon name={icon} size={Math.round(size * 0.5)} className="relative text-white" />}
    </span>
  );
}

export function AgentAvatar({
  agent,
  size = 40,
  ring = false,
  glow = false,
  className = "",
}: {
  agent: AgentDef;
  size?: number;
  ring?: boolean;
  glow?: boolean;
  className?: string;
}) {
  return (
    <Avatar
      from={agent.gradient[0]}
      to={agent.gradient[1]}
      icon={agent.icon}
      size={size}
      ring={ring}
      glow={glow}
      className={className}
    />
  );
}

export function UserAvatar({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-white/10"
      style={{
        width: size,
        height: size,
        backgroundImage: "linear-gradient(135deg, #475569, #1e293b)",
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60" />
      <User size={Math.round(size * 0.5)} className="relative text-white/90" />
    </span>
  );
}
