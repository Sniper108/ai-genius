import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Attachments are written under .nexus/attachments and served back via
// /api/attachment/<name> (works in both dev and production). Everything stays
// on your machine.
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 25 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 25 MB)" }, { status: 413 });
  }

  try {
    const dir = path.join(process.cwd(), ".nexus", "attachments");
    await mkdir(dir, { recursive: true });
    const safe = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`.slice(-120);
    const buf = Buffer.from(await file.arrayBuffer());
    const abs = path.join(dir, safe);
    await writeFile(abs, buf);

    // For text-like files, return the content so any agent (even ones without
    // file tools) gets it inline as context.
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const TEXTY = new Set([
      "txt", "md", "csv", "tsv", "json", "log", "yml", "yaml", "html", "xml",
      "js", "ts", "tsx", "py", "css", "sql",
    ]);
    let text: string | undefined;
    if ((file.type.startsWith("text/") || TEXTY.has(ext)) && file.size < 300 * 1024) {
      text = buf.toString("utf8");
    }

    return Response.json({
      name: file.name,
      url: `/api/attachment/${encodeURIComponent(safe)}`,
      type: file.type || "application/octet-stream",
      absPath: abs,
      text,
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Write failed" }, { status: 500 });
  }
}
