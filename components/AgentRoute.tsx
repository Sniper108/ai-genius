"use client";

import type { AgentDef } from "@/lib/types";
import { useFleetStatus } from "@/lib/useFleetStatus";
import { ClaudeChat } from "./ClaudeChat";
import { AgentChat } from "./AgentChat";
import { LiveAgentChat } from "./LiveAgentChat";

export function AgentRoute({ agent }: { agent: AgentDef }) {
  const statuses = useFleetStatus();
  const status = statuses[agent.id] ?? agent.defaultStatus;

  if (agent.kind === "claude") return <ClaudeChat agent={agent} status={status} />;
  if (agent.bridge) return <LiveAgentChat agent={agent} status={status} />;
  return <AgentChat agent={agent} status={status} />;
}
