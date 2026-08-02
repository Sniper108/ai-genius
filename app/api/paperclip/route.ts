import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Use 127.0.0.1 (not localhost) so Node's fetch doesn't try IPv6 first.
const URL = process.env.PAPERCLIP_URL || "http://127.0.0.1:3100";

/** Reports whether Paperclip is running locally. */
export async function GET(_req: NextRequest) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    await fetch(URL, { signal: controller.signal });
    clearTimeout(t);
    return Response.json({ reachable: true, url: "http://localhost:3100" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ reachable: false, url: "http://localhost:3100" }, { headers: { "Cache-Control": "no-store" } });
  }
}
