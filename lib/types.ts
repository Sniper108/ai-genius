export type AgentStatus = "online" | "idle" | "offline" | "connecting";

export type AgentKind = "claude" | "external";

export interface AgentDef {
  /** URL-safe id, used in routes: /agents/[id] */
  id: string;
  name: string;
  tagline: string;
  /** "claude" agents are driven by the real Claude Code CLI bridge. */
  kind: AgentKind;
  /** Tailwind-friendly hex accent used for glows and gradients. */
  accent: string;
  /** Two-stop gradient [from, to] used for the agent's avatar/logo. */
  gradient: [string, string];
  /** lucide-react icon name. */
  icon: string;
  /** Short capability blurb list shown on the agent bay. */
  capabilities: string[];
  /** Optional external endpoint this agent talks to (external kind only). */
  endpoint?: string;
  /**
   * If set, this agent is driven by a real local CLI bridge at this API path
   * (e.g. "/api/hermes"). Bridged agents stream live replies instead of demo
   * text.
   */
  bridge?: string;
  /** Default status if the agent can't self-report. */
  defaultStatus: AgentStatus;
}

/** A single event line in the Claude CLI stream, normalized for the UI. */
export type ClaudeStreamEvent =
  | { kind: "init"; sessionId: string; model?: string; tools?: string[]; cwd?: string }
  | { kind: "text"; text: string }
  | { kind: "thinking"; text: string }
  | { kind: "tool_use"; name: string; input: unknown; id: string }
  | { kind: "tool_result"; text: string; id?: string; isError?: boolean }
  | {
      kind: "result";
      text: string;
      sessionId?: string;
      costUsd?: number;
      durationMs?: number;
      numTurns?: number;
      isError?: boolean;
    }
  | { kind: "error"; message: string }
  | { kind: "done" };
