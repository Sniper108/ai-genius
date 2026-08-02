# NEXUS — AI Mission Control

A beautiful, local-first operating system for commanding **Claude** and
orchestrating your entire fleet of AI agents from a single, gorgeous dashboard.

Built with **Next.js 15 · Tailwind CSS · Framer Motion · TypeScript**, and
wired directly to your own Claude through the **Claude Code CLI bridge**.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/Tailwind-3-38bdf8) ![stack](https://img.shields.io/badge/Framer_Motion-11-ff0080)

---

## ✨ What's inside

- **Mission Control** (`/`) — live host vitals (CPU, memory, uptime), an animated
  agent-fleet grid, a real-time activity feed, and a one-tap launch into Claude.
- **Claude Console** (`/claude`) — a streaming console wired to the real `claude`
  CLI. Full session continuity, live cost + latency tickers, collapsible tool-use
  and thinking blocks, and an optional **YOLO mode** (skips permission prompts).
- **Agent Bays** (`/agents/[id]`) — a dedicated control panel for each external
  agent (OpenClaw, Hermes, Atlas…): status, capabilities, connection config, and
  a command console that talks to the agent's local endpoint.

Everything is **config-driven** — add a new agent by dropping one object into
[`lib/agents.ts`](lib/agents.ts) and it shows up across the sidebar, the fleet
grid, and gets its own bay.

## 🔌 The Claude Code CLI bridge

The dashboard talks to your Claude by spawning the `claude` binary as a child
process and streaming its output back over Server-Sent Events.

- API route: [`app/api/claude/route.ts`](app/api/claude/route.ts)
- It runs `claude -p "<prompt>" --output-format stream-json --verbose`
- Session id is captured from the stream and passed back with `--resume` so the
  conversation stays continuous.
- Client hook: [`lib/useClaudeStream.ts`](lib/useClaudeStream.ts) parses the SSE
  frames into interleaved text / thinking / tool-use / tool-result blocks.

Because it drives the real CLI, Claude can read this repo, run tools, edit files,
and act on your commands — exactly as it would in your terminal.

> **YOLO mode** adds `--dangerously-skip-permissions`. It lets Claude act without
> asking, which is powerful and risky. It's off by default; toggle it in the
> console header only when you know what you're doing.

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Make sure the Claude Code CLI is installed and authenticated
claude --version        # should print a version
# (run `claude` once interactively to log in if you haven't)

# 3. Start the dashboard
npm run dev

# 4. Open it
open http://localhost:3000
```

The app is **local-first** — the bridge spawns your local `claude`, so nothing
leaves your machine except the calls Claude itself makes.

## 🧩 Adding an agent

Open [`lib/agents.ts`](lib/agents.ts) and add an entry:

```ts
{
  id: "myagent",
  name: "My Agent",
  tagline: "What it does",
  kind: "external",
  accent: "#f472b6",
  icon: "Bot",            // any name mapped in components/Icon.tsx
  capabilities: ["…"],
  endpoint: "http://localhost:8720",
  defaultStatus: "idle",
}
```

That's it — the sidebar, dashboard card, and `/agents/myagent` bay appear
automatically. Fleet status is probed from `GET {endpoint}/health`.

## 🗂 Project structure

```
app/
  api/claude/route.ts   ← Claude Code CLI bridge (SSE stream)
  api/system/route.ts   ← live host vitals
  api/agents/route.ts   ← fleet status probe
  page.tsx              ← Mission Control dashboard
  claude/page.tsx       ← Claude Console
  agents/[id]/page.tsx  ← per-agent control bay
components/             ← UI: sidebar, cards, console, feed, vitals…
lib/                    ← agent registry, types, streaming hooks
legacy/                 ← the original static landing page, preserved
```

## 🎨 Design

Dark, glassmorphic, aurora-lit, and unapologetically dopamine-forward: animated
gradient text, pulse-ring status indicators, spring-physics motion, live tickers,
and a grain overlay. Each agent carries its own accent color through glows,
borders, and highlights.

---

_Local mission control for your AI fleet. Bridged to your Claude._
