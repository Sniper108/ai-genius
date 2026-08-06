import { spawn } from "node:child_process";
import type { NextRequest } from "next/server";

// Spawns the local `codex` CLI in headless exec mode, so this must run on the
// Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: codex\ndata: ${JSON.stringify(data)}\n\n`);
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
  // `codex exec` = non-interactive: it streams progress to stderr and prints
  // only the final answer to stdout. read-only + skip-git-repo-check keep it a
  // safe Q&A/codegen agent that never edits files on disk. Model + provider
  // (OmniRoute) come from ~/.codex/config.toml.
  const args = ["exec", "--skip-git-repo-check", "--sandbox", "read-only", prompt];

  // Codex reads its provider key from the env var named in config.toml
  // (OMNIROUTE_API_KEY). OmniRoute ignores the value, so a placeholder is fine
  // — this guarantees the child has it even if the dev server didn't inherit it.
  const env = { ...process.env, OMNIROUTE_API_KEY: process.env.OMNIROUTE_API_KEY || "omniroute" };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let child: ReturnType<typeof spawn>;
      try {
        child = isWindows
          ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "codex", ...args], { env })
          : spawn("codex", args, { env });
      } catch (err: any) {
        controller.enqueue(sse({ kind: "error", message: `Failed to launch codex: ${err?.message}` }));
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

      // stdout = the final answer.
      child.stdout?.on("data", (chunk: Buffer) => {
        const text = chunk.toString().replace(ANSI, "");
        if (text) controller.enqueue(sse({ kind: "text", text }));
      });

      // stderr = progress logs; keep only in case the run fails.
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        const hint =
          (err as any)?.code === "ENOENT"
            ? "The `codex` command wasn't found. Install it (npm install -g @openai/codex), then restart the dev server."
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
