import { notFound, redirect } from "next/navigation";
import { AGENTS, getAgent } from "@/lib/agents";
import { AgentBay } from "@/components/AgentBay";

export function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }));
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) notFound();
  // The prime agent lives in the dedicated console.
  if (agent.kind === "claude") redirect("/claude");
  return <AgentBay agent={agent} />;
}
