"use client";

import type { AgentDef } from "@/lib/types";
import { useFleetStatus } from "@/lib/useFleetStatus";
import { ClaudeChat } from "./ClaudeChat";
import { AgentChat } from "./AgentChat";

export function AgentRoute({ agent }: { agent: AgentDef }) {
  const statuses = useFleetStatus();
  const status = statuses[agent.id] ?? agent.defaultStatus;

  return agent.kind === "claude" ? (
    <ClaudeChat agent={agent} status={status} />
  ) : (
    <AgentChat agent={agent} status={status} />
  );
}
