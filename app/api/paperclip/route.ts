export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Try IPv4 and IPv6 loopback (and an env override) — a local app may bind to
// only one of them, so a single-address check can false-negative.
const TARGETS = [
  process.env.PAPERCLIP_URL,
  "http://127.0.0.1:3100",
  "http://[::1]:3100",
].filter(Boolean) as string[];

async function ping(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    return true;
  } catch {
    return false;
  }
}

/** Reports whether Paperclip is reachable on localhost:3100. */
export async function GET() {
  for (const url of TARGETS) {
    if (await ping(url)) {
      return Response.json(
        { reachable: true, url: "http://localhost:3100" },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return Response.json(
    { reachable: false, url: "http://localhost:3100" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
