import { spawn } from "node:child_process";
import type { NextRequest } from "next/server";

// Spawns the local `openclaw` CLI, so this must run on the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OpenClaw needs an agent context (--agent/--to/--session-id). Override the
// agent id with OPENCLAW_AGENT if your default agent is named differently.
const AGENT_ID = process.env.OPENCLAW_AGENT || "default";

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: openclaw\ndata: ${JSON.stringify(data)}\n\n`);
}

// eslint-disable-next-line no-control-regex
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    ({ prompt } = await req.json());
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!prompt?.trim()) return new Response("Missing prompt", { status: 400 });

  const isWindows = process.platform === "win32";
  // openclaw agent --agent <id> --local --message "<prompt>"
  // --message and the prompt are discrete argv entries, so the prompt is never
  // concatenated into a shell string (no command injection).
  const args = ["agent", "--agent", AGENT_ID, "--local", "--message", prompt];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let child: ReturnType<typeof spawn>;
      try {
        child = isWindows
          ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "openclaw", ...args], {
              env: process.env,
            })
          : spawn("openclaw", args, { env: process.env });
      } catch (err: any) {
        controller.enqueue(sse({ kind: "error", message: `Failed to launch openclaw: ${err?.message}` }));
        controller.enqueue(sse({ kind: "done" }));
        controller.close();
        return;
      }

      let stderr = "";
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      child.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString().replace(ANSI, "");
        if (text) controller.enqueue(sse({ kind: "text", text }));
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        const hint =
          (err as any)?.code === "ENOENT"
            ? "The `openclaw` command wasn't found. Install it (npm install -g openclaw), run `openclaw onboard`, then restart the dev server."
            : err.message;
        controller.enqueue(sse({ kind: "error", message: hint }));
        controller.enqueue(sse({ kind: "done" }));
        safeClose();
      });

      child.on("close", (code) => {
        if (code !== 0 && stderr.trim()) {
          controller.enqueue(sse({ kind: "error", message: stderr.replace(ANSI, "").trim().slice(0, 4000) }));
        }
        controller.enqueue(sse({ kind: "done" }));
        safeClose();
      });

      req.signal.addEventListener("abort", () => {
        child.kill("SIGTERM");
        safeClose();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
