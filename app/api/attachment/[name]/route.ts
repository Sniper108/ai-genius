import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Only allow the exact safe names the upload route produces — blocks any path
// traversal (no slashes, dots-only, etc.).
const SAFE = /^[0-9]+_[A-Za-z0-9._-]+$/;

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
  md: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json; charset=utf-8",
};

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  if (!SAFE.test(name)) return new Response("Bad name", { status: 400 });

  const file = path.join(process.cwd(), ".nexus", "attachments", name);
  if (!existsSync(file)) return new Response("Not found", { status: 404 });

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPES[ext] ?? "application/octet-stream";
  const buf = await readFile(file);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": type, "Cache-Control": "no-store" },
  });
}
