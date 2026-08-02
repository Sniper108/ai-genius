import { spawn } from "node:child_process";
import type { NextRequest } from "next/server";

// The bridge spawns the real `claude` binary, so this must run on Node.js.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ClaudeRequestBody {
  prompt: string;
  /** Resume a prior CLI session for conversational continuity. */
  sessionId?: string;
  /** Optional working directory for Claude to operate in. */
  cwd?: string;
  /** Optional model override, e.g. "claude-sonnet-5". */
  model?: string;
  /** When true, adds --dangerously-skip-permissions. Handle with care. */
  yolo?: boolean;
}

function sse(event: string, data: unknown): Uint8Array {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  return new TextEncoder().encode(`event: ${event}\ndata: ${payload}\n\n`);
}

/**
 * Translate a raw stream-json line from the Claude CLI into the normalized
 * ClaudeStreamEvent shape the UI understands.
 */
function normalize(obj: any): Array<{ event: string; data: unknown }> {
  const out: Array<{ event: string; data: unknown }> = [];

  if (obj?.type === "system" && obj?.subtype === "init") {
    out.push({
      event: "claude",
      data: {
        kind: "init",
        sessionId: obj.session_id,
        model: obj.model,
        tools: obj.tools,
        cwd: obj.cwd,
      },
    });
    return out;
  }

  if (obj?.type === "assistant" && obj?.message?.content) {
    for (const block of obj.message.content) {
      if (block.type === "text" && block.text) {
        out.push({ event: "claude", data: { kind: "text", text: block.text } });
      } else if (block.type === "thinking" && block.thinking) {
        out.push({ event: "claude", data: { kind: "thinking", text: block.thinking } });
      } else if (block.type === "tool_use") {
        out.push({
          event: "claude",
          data: { kind: "tool_use", name: block.name, input: block.input, id: block.id },
        });
      }
    }
    return out;
  }

  if (obj?.type === "user" && obj?.message?.content) {
    for (const block of obj.message.content) {
      if (block.type === "tool_result") {
        const content = Array.isArray(block.content)
          ? block.content.map((c: any) => c.text ?? "").join("")
          : typeof block.content === "string"
          ? block.content
          : "";
        out.push({
          event: "claude",
          data: {
            kind: "tool_result",
            text: content,
            id: block.tool_use_id,
            isError: block.is_error,
          },
        });
      }
    }
    return out;
  }

  if (obj?.type === "result") {
    out.push({
      event: "claude",
      data: {
        kind: "result",
        text: obj.result ?? "",
        sessionId: obj.session_id,
        costUsd: obj.total_cost_usd,
        durationMs: obj.duration_ms,
        numTurns: obj.num_turns,
        isError: obj.is_error || obj.subtype !== "success",
      },
    });
    return out;
  }

  return out;
}

export async function POST(req: NextRequest) {
  let body: ClaudeRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!body.prompt?.trim()) {
    return new Response("Missing prompt", { status: 400 });
  }

  // The prompt is fed over stdin (not as a CLI arg) so it never needs shell
  // quoting/escaping — the only things on the command line are safe flags.
  const args = ["-p", "--output-format", "stream-json", "--verbose"];
  if (body.sessionId) args.push("--resume", body.sessionId);
  if (body.model) args.push("--model", body.model);
  if (body.yolo) args.push("--dangerously-skip-permissions");

  // On Windows the `claude` binary is a `.cmd` shim, which can only be launched
  // through a shell; on macOS/Linux we spawn the executable directly.
  const isWindows = process.platform === "win32";
  const command = isWindows ? "claude.cmd" : "claude";

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let child: ReturnType<typeof spawn>;
      try {
        child = spawn(command, args, {
          cwd: body.cwd || process.cwd(),
          env: process.env,
          shell: isWindows,
        });
      } catch (err: any) {
        controller.enqueue(
          sse("claude", { kind: "error", message: `Failed to launch claude: ${err?.message}` }),
        );
        controller.enqueue(sse("claude", { kind: "done" }));
        controller.close();
        return;
      }

      // Feed the prompt to the CLI over stdin, then close it so Claude runs.
      try {
        child.stdin?.on("error", () => {
          /* ignore EPIPE if the process exits before we finish writing */
        });
        child.stdin?.write(body.prompt);
        child.stdin?.end();
      } catch {
        /* stdin unavailable — the error handlers below will surface it */
      }

      let buffer = "";
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
        buffer += chunk.toString();
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const obj = JSON.parse(line);
            for (const { event, data } of normalize(obj)) {
              controller.enqueue(sse(event, data));
            }
          } catch {
            // Not JSON — forward as raw text so nothing is lost.
            controller.enqueue(sse("claude", { kind: "text", text: line }));
          }
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        controller.enqueue(
          sse("claude", { kind: "error", message: `Process error: ${err.message}` }),
        );
        controller.enqueue(sse("claude", { kind: "done" }));
        safeClose();
      });

      child.on("close", (code) => {
        if (code !== 0 && stderr.trim()) {
          controller.enqueue(
            sse("claude", {
              kind: "error",
              message: stderr.trim().slice(0, 4000),
            }),
          );
        }
        controller.enqueue(sse("claude", { kind: "done" }));
        safeClose();
      });

      // If the client disconnects, kill the child so we don't leak processes.
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
