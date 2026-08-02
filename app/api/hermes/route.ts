import { spawn } from "node:child_process";
import type { NextRequest } from "next/server";

// Spawns the local `hermes` CLI, so this must run on the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: hermes\ndata: ${JSON.stringify(data)}\n\n`);
}

// Strip ANSI color / control sequences so the chat shows clean text.
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "");
}

export async function POST(req: NextRequest) {
  let prompt = "";
  try {
    ({ prompt } = await req.json());
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!prompt?.trim()) return new Response("Missing prompt", { status: 400 });

  const isWindows = process.platform === "win32";
  // `hermes -z "<prompt>"` = one-shot mode: prints only the final response.
  const hermesArgs = ["-z", prompt];

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let child: ReturnType<typeof spawn>;
      try {
        if (isWindows) {
          // Route through cmd.exe (it resolves the `hermes` shim via PATHEXT).
          // shell stays FALSE and the prompt is a discrete argv entry, so Node
          // does the cmd-safe quoting — the prompt is never concatenated into a
          // shell string, avoiding command injection.
          const comspec = process.env.ComSpec || "cmd.exe";
          child = spawn(comspec, ["/d", "/s", "/c", "hermes", ...hermesArgs], {
            env: process.env,
          });
        } else {
          child = spawn("hermes", hermesArgs, { env: process.env });
        }
      } catch (err: any) {
        controller.enqueue(sse({ kind: "error", message: `Failed to launch hermes: ${err?.message}` }));
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
        const text = stripAnsi(chunk.toString());
        if (text) controller.enqueue(sse({ kind: "text", text }));
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        const hint =
          (err as any)?.code === "ENOENT"
            ? "The `hermes` command wasn't found. Make sure Hermes is installed and on your PATH, then restart the dev server."
            : err.message;
        controller.enqueue(sse({ kind: "error", message: hint }));
        controller.enqueue(sse({ kind: "done" }));
        safeClose();
      });

      child.on("close", (code) => {
        if (code !== 0 && stderr.trim()) {
          controller.enqueue(sse({ kind: "error", message: stripAnsi(stderr.trim()).slice(0, 4000) }));
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
