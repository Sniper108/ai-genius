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
    gradient: ["#ff8a4c", "#ff5f6d"],
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
    tagline: "Personal agent · live CLI bridge",
    kind: "external",
    accent: "#22d3ee",
    gradient: ["#22d3ee", "#3b82f6"],
    icon: "Bot",
    capabilities: [
      "What can you do?",
      "Summarize this folder",
      "Draft a message for me",
      "Run a task for me",
    ],
    endpoint: "http://localhost:8711",
    bridge: "/api/openclaw",
    bridgeNote: "running openclaw agent --local on your machine · first reply can take a few seconds",
    defaultStatus: "online",
  },
  {
    id: "hermes",
    name: "Hermes",
    tagline: "Nous Research agent · live CLI bridge",
    kind: "external",
    accent: "#a3e635",
    gradient: ["#a3e635", "#22c55e"],
    icon: "Send",
    capabilities: [
      "What can you do?",
      "Summarize this project",
      "Draft a message for me",
      "Run a shell command",
    ],
    endpoint: "http://localhost:9119",
    bridge: "/api/hermes",
    bridgeNote: "running hermes -z on your machine · first reply can take a few seconds",
    defaultStatus: "online",
  },
  {
    id: "omniroute",
    name: "OmniRoute",
    tagline: "Free multi-provider AI gateway · code for free",
    kind: "external",
    accent: "#2dd4bf",
    gradient: ["#2dd4bf", "#0ea5e9"],
    icon: "Route",
    capabilities: [
      "Write a function for me",
      "Explain this error",
      "Refactor this code",
      "Which model am I on?",
    ],
    endpoint: "http://localhost:20128",
    bridge: "/api/omniroute",
    bridgeNote: "routed through OmniRoute on localhost:20128 · free-tier providers",
    defaultStatus: "idle",
  },
  {
    id: "codex",
    name: "Codex",
    tagline: "OpenAI Codex · free via OmniRoute",
    kind: "external",
    accent: "#a1a1aa",
    gradient: ["#d4d4d8", "#52525b"],
    icon: "Terminal",
    capabilities: [
      "Write a function for me",
      "Explain this code",
      "Generate a script",
      "Refactor a snippet",
    ],
    endpoint: "http://localhost:20128",
    bridge: "/api/codex",
    bridgeNote: "running codex exec (read-only) on your machine · routed free through OmniRoute · first reply can take a minute",
    defaultStatus: "idle",
  },
  {
    id: "atlas",
    name: "Atlas",
    tagline: "Research & knowledge miner",
    kind: "external",
    accent: "#7c5cff",
    gradient: ["#7c5cff", "#c084fc"],
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
