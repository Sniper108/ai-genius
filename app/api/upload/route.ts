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
    await writeFile(path.join(dir, safe), buf);
    return Response.json({
      name: file.name,
      url: `/api/attachment/${encodeURIComponent(safe)}`,
      type: file.type || "application/octet-stream",
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? "Write failed" }, { status: 500 });
  }
}
