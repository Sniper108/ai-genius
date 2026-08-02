import { notFound } from "next/navigation";
import { AGENTS, getAgent } from "@/lib/agents";
import { AgentRoute } from "@/components/AgentRoute";

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
  return <AgentRoute agent={agent} />;
}
