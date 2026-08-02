import type { AgentDef } from "./types";

/**
 * The fleet registry. Add a new agent by dropping an object in here — the
 * dashboard cards, the sidebar, and the /agents/[id] bays all read from this.
 */
export const AGENTS: AgentDef[] = [
  {
    id: "claude",
    name: "Claude",
    tagline: "Prime intelligence · Claude Code CLI bridge",
    kind: "claude",
    accent: "#ff7a45",
    icon: "Sparkles",
    capabilities: [
      "Full Claude Code CLI access",
      "Reads & edits your codebase",
      "Runs shell, git, and tools",
      "Streaming session with cost + latency",
    ],
    defaultStatus: "online",
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    tagline: "Autonomous web operator",
    kind: "external",
    accent: "#22d3ee",
    icon: "Bot",
    capabilities: [
      "Browser automation",
      "Data extraction & scraping",
      "Form-filling workflows",
      "Scheduled runs",
    ],
    endpoint: "http://localhost:8711",
    defaultStatus: "idle",
  },
  {
    id: "hermes",
    name: "Hermes",
    tagline: "Comms & messaging courier",
    kind: "external",
    accent: "#a3e635",
    icon: "Send",
    capabilities: [
      "Email & inbox triage",
      "Slack / Discord relay",
      "Drafting & summarization",
      "Notification routing",
    ],
    endpoint: "http://localhost:8712",
    defaultStatus: "idle",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Research & knowledge miner",
    kind: "external",
    accent: "#7c5cff",
    icon: "Telescope",
    capabilities: [
      "Deep web research",
      "Source cross-referencing",
      "Report synthesis",
      "Citation tracking",
    ],
    endpoint: "http://localhost:8713",
    defaultStatus: "offline",
  },
];

export function getAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}
