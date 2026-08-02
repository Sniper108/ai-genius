import { spawn, type ChildProcess } from "node:child_process";

/**
 * Manages the long-running `hermes gateway` process (messaging bridge for
 * Discord/Telegram/etc.). State lives on globalThis so it survives dev HMR and
 * is shared across API-route invocations within the single server process.
 */
interface GatewayState {
  child: ChildProcess | null;
  startedAt: number | null;
  logs: string[];
}

const MAX_LOGS = 400;
const g = globalThis as unknown as { __hermesGateway?: GatewayState; __hermesGatewayHooked?: boolean };
const state: GatewayState = g.__hermesGateway ?? (g.__hermesGateway = { child: null, startedAt: null, logs: [] });

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

function pushLog(chunk: string) {
  for (const raw of chunk.replace(ANSI, "").split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line.trim()) continue;
    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    state.logs.push(`${ts}  ${line}`);
  }
  if (state.logs.length > MAX_LOGS) state.logs.splice(0, state.logs.length - MAX_LOGS);
}

export function isRunning(): boolean {
  return !!state.child && !state.child.killed && state.child.exitCode === null;
}

export function getStatus() {
  return {
    running: isRunning(),
    pid: state.child?.pid ?? null,
    startedAt: state.startedAt,
    logs: state.logs.slice(-250),
  };
}

export function startGateway() {
  if (isRunning()) return getStatus();

  const isWindows = process.platform === "win32";
  state.logs = [];
  pushLog("[nexus] launching `hermes gateway`…");

  let child: ChildProcess;
  try {
    child = isWindows
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "hermes", "gateway"], { env: process.env })
      : spawn("hermes", ["gateway"], { env: process.env });
  } catch (err: any) {
    pushLog(`[error] failed to launch: ${err?.message}`);
    return getStatus();
  }

  state.child = child;
  state.startedAt = Date.now();

  child.stdout?.on("data", (b: Buffer) => pushLog(b.toString()));
  child.stderr?.on("data", (b: Buffer) => pushLog(b.toString()));
  child.on("error", (err) => {
    pushLog(
      (err as any)?.code === "ENOENT"
        ? "[error] `hermes` not found on PATH — install Hermes and restart the dev server."
        : `[error] ${err.message}`,
    );
  });
  child.on("close", (code) => {
    pushLog(`[nexus] gateway process exited (code ${code ?? "?"})`);
    state.child = null;
    state.startedAt = null;
  });

  return getStatus();
}

export function stopGateway() {
  const child = state.child;
  if (child?.pid) {
    pushLog("[nexus] stopping gateway…");
    if (process.platform === "win32") {
      // Kill the whole cmd.exe → hermes process tree.
      try {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
      } catch {
        child.kill();
      }
    } else {
      child.kill("SIGTERM");
    }
  }
  return getStatus();
}

// Best-effort: don't leave an orphaned gateway if the server goes down.
if (!g.__hermesGatewayHooked) {
  g.__hermesGatewayHooked = true;
  const cleanup = () => {
    try {
      state.child?.kill();
    } catch {
      /* ignore */
    }
  };
  process.on("exit", cleanup);
  process.on("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.on("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}
