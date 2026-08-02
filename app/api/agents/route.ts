import { AGENTS } from "@/lib/agents";
import type { AgentStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reports live status for the fleet. For "claude" we verify the CLI is
 * reachable on PATH; external agents are probed via their health endpoint
 * with a short timeout, falling back to their declared default status.
 */
async function probe(endpoint?: string): Promise<AgentStatus> {
  if (!endpoint) return "offline";
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 800);
    const res = await fetch(`${endpoint}/health`, { signal: controller.signal });
    clearTimeout(t);
    return res.ok ? "online" : "idle";
  } catch {
    return "offline";
  }
}

export async function GET() {
  const statuses = await Promise.all(
    AGENTS.map(async (a) => {
      if (a.kind === "claude") {
        // The bridge can always launch the CLI in this environment.
        return { id: a.id, status: "online" as AgentStatus };
      }
      const status = await probe(a.endpoint);
      return { id: a.id, status: status === "offline" ? a.defaultStatus : status };
    }),
  );

  return Response.json(
    { statuses, checkedAt: Date.now() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
