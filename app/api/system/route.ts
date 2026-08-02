import os from "node:os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let lastCpu = os.cpus();
let lastSample = Date.now();

function cpuLoad(): number {
  const now = os.cpus();
  let idleDelta = 0;
  let totalDelta = 0;
  for (let i = 0; i < now.length; i++) {
    const prev = lastCpu[i]?.times;
    const cur = now[i].times;
    if (!prev) continue;
    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const curTotal = cur.user + cur.nice + cur.sys + cur.idle + cur.irq;
    idleDelta += cur.idle - prev.idle;
    totalDelta += curTotal - prevTotal;
  }
  lastCpu = now;
  lastSample = Date.now();
  if (totalDelta <= 0) return 0;
  return Math.min(100, Math.max(0, (1 - idleDelta / totalDelta) * 100));
}

export async function GET() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const data = {
    hostname: os.hostname(),
    platform: os.platform(),
    uptimeSec: os.uptime(),
    cores: os.cpus().length,
    cpuPct: Math.round(cpuLoad()),
    loadAvg: os.loadavg().map((n) => Number(n.toFixed(2))),
    mem: {
      totalGb: Number((totalMem / 1024 ** 3).toFixed(1)),
      usedGb: Number((usedMem / 1024 ** 3).toFixed(1)),
      pct: Math.round((usedMem / totalMem) * 100),
    },
    sampledAt: lastSample,
  };

  return Response.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
