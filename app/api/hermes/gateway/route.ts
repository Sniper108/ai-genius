import type { NextRequest } from "next/server";
import { getStatus, startGateway, stopGateway } from "@/lib/gatewayManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(getStatus(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  let action = "";
  try {
    ({ action } = await req.json());
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (action === "start") return Response.json(startGateway());
  if (action === "stop") return Response.json(stopGateway());
  return new Response("Unknown action (expected start|stop)", { status: 400 });
}
