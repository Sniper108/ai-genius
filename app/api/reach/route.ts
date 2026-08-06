import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The Reach launcher reads web pages and runs web searches via Jina's hosted,
// keyless endpoints — the same "web reading" backend Agent-Reach uses for its
// zero-config web channel. r.jina.ai returns clean markdown for any URL;
// s.jina.ai returns markdown search results. Everything runs from your machine.
const READER = "https://r.jina.ai/";
const SEARCH = "https://s.jina.ai/";

export async function POST(req: NextRequest) {
  let mode = "read";
  let input = "";
  try {
    const body = await req.json();
    mode = body.mode === "search" ? "search" : "read";
    input = (body.input ?? "").toString().trim();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!input) return Response.json({ error: "Nothing to fetch" }, { status: 400 });

  let target: string;
  if (mode === "search") {
    target = SEARCH + encodeURIComponent(input);
  } else {
    const url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    target = READER + url;
  }

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 45000);
    const res = await fetch(target, {
      headers: { Accept: "text/plain", "X-Return-Format": "markdown" },
      signal: controller.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    if (!res.ok) {
      return Response.json(
        { error: `Reader returned ${res.status}. ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }
    return Response.json({ content: text });
  } catch (err: any) {
    const msg =
      err?.name === "AbortError"
        ? "Timed out fetching that — the page may be slow or blocked."
        : `Couldn't reach the reader service: ${err?.message ?? err}`;
    return Response.json({ error: msg }, { status: 502 });
  }
}
