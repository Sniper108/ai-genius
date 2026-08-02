import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OmniRoute exposes an OpenAI-compatible gateway locally. Override with env if
// you run it on a different host/port, or pin a specific model instead of auto.
const BASE = process.env.OMNIROUTE_URL || "http://localhost:20128/v1";
const MODEL = process.env.OMNIROUTE_MODEL || "auto";
const KEY = process.env.OMNIROUTE_KEY || "omniroute";

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`event: omniroute\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  let prompt = "";
  let model = MODEL;
  try {
    const body = await req.json();
    prompt = body.prompt;
    if (body.model) model = body.model;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!prompt?.trim()) return new Response("Missing prompt", { status: 400 });

  const payload = {
    model,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "You are an expert, concise coding assistant. Prefer working code with short explanations.",
      },
      { role: "user", content: prompt },
    ],
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
      const fail = (message: string) => {
        controller.enqueue(sse({ kind: "error", message }));
        controller.enqueue(sse({ kind: "done" }));
        safeClose();
      };

      let upstream: Response;
      try {
        upstream = await fetch(`${BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
          body: JSON.stringify(payload),
          signal: req.signal,
        });
      } catch {
        return fail(
          `Couldn't reach OmniRoute at ${BASE}. Install it (npm install -g omniroute), run \`omniroute\`, connect a free provider in its dashboard, then try again.`,
        );
      }

      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => "");
        return fail(`OmniRoute returned ${upstream.status}. ${detail.slice(0, 300)}`);
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content ?? "";
              if (delta) controller.enqueue(sse({ kind: "text", text: delta }));
            } catch {
              /* skip non-JSON keepalive lines */
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          controller.enqueue(sse({ kind: "error", message: `Stream error: ${err?.message ?? err}` }));
        }
      }

      controller.enqueue(sse({ kind: "done" }));
      safeClose();
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
