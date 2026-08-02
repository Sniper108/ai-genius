"use client";

import {
  Sparkles,
  Bot,
  Send,
  Telescope,
  LayoutDashboard,
  Terminal,
  Activity,
  Cpu,
  Zap,
  Route,
  Circle,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Sparkles,
  Bot,
  Send,
  Telescope,
  LayoutDashboard,
  Terminal,
  Activity,
  Cpu,
  Zap,
  Route,
  Circle,
};

export function Icon({
  name,
  className,
  size = 18,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = MAP[name] ?? Circle;
  return <Cmp className={className} size={size} />;
}
