import { NextRequest, NextResponse } from "next/server";
import { topUpAllPools } from "@/lib/questionGeneration";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await topUpAllPools();
    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
    return NextResponse.json({ totalGenerated, results });
  } catch (err: any) {
    console.error("cron generate error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal top-up." }, { status: 500 });
  }
}

// Allow GET too, in case an external scheduler (e.g. cron-job.org) only sends GET.
export async function GET(req: NextRequest) {
  return POST(req);
}
