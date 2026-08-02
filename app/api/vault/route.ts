import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBFOLDER = "Agentic OS";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dailyFile(vaultPath: string, date: string) {
  return path.join(vaultPath, SUBFOLDER, `${date}.md`);
}

/** POST: append a timestamped entry to today's daily note. */
export async function POST(req: NextRequest) {
  let body: {
    vaultPath?: string;
    date?: string;
    time?: string;
    heading?: string;
    body?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const { vaultPath, date, time = "", heading, body: entryBody = "" } = body;
  if (!vaultPath) return Response.json({ error: "No vault path configured" }, { status: 400 });
  if (!date || !DATE_RE.test(date)) return Response.json({ error: "Bad date" }, { status: 400 });
  if (!heading) return Response.json({ error: "Missing heading" }, { status: 400 });
  if (!existsSync(vaultPath))
    return Response.json({ error: `Vault folder not found: ${vaultPath}` }, { status: 400 });

  try {
    const dir = path.join(vaultPath, SUBFOLDER);
    await fs.mkdir(dir, { recursive: true });
    const file = dailyFile(vaultPath, date);
    const header = existsSync(file) ? "" : `# Agentic OS · ${date}\n\n`;
    const entry = `## ${time} · ${heading}\n\n${entryBody.trim()}\n\n---\n\n`;
    await fs.appendFile(file, header + entry, "utf8");
    return Response.json({ ok: true, file });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Write failed" }, { status: 500 });
  }
}

/** GET: verify the vault path, or read back today's daily note. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vaultPath = searchParams.get("vaultPath") ?? "";
  const date = searchParams.get("date") ?? "";

  if (searchParams.get("verify") === "1") {
    const exists = !!vaultPath && existsSync(vaultPath);
    return Response.json({
      exists,
      folder: exists ? path.join(vaultPath, SUBFOLDER) : null,
    });
  }

  if (!vaultPath || !DATE_RE.test(date))
    return Response.json({ error: "Missing vaultPath or date" }, { status: 400 });

  const file = dailyFile(vaultPath, date);
  if (!existsSync(file)) return Response.json({ content: "", file });
  try {
    const content = await fs.readFile(file, "utf8");
    return Response.json({ content, file });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Read failed" }, { status: 500 });
  }
}
