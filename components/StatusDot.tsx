import type { AgentStatus } from "@/lib/types";

const CONFIG: Record<AgentStatus, { color: string; label: string }> = {
  online: { color: "#a3e635", label: "Online" },
  idle: { color: "#fbbf24", label: "Idle" },
  connecting: { color: "#22d3ee", label: "Connecting" },
  offline: { color: "#64748b", label: "Offline" },
};

export function StatusDot({
  status,
  showLabel = false,
}: {
  status: AgentStatus;
  showLabel?: boolean;
}) {
  const { color, label } = CONFIG[status];
  const live = status === "online" || status === "connecting";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {live && (
          <span
            className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
        />
      </span>
      {showLabel && (
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
      )}
    </span>
  );
}
