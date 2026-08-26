import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { topUpAllPools } from "@/lib/questionGeneration";
import { isJobCancelled, finishJob } from "@/lib/generationJobs";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const jobId: string | undefined = body?.jobId;

  try {
    const { results, rateLimited } = await topUpAllPools(jobId);
    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
    const cancelled = await isJobCancelled(jobId);
    await finishJob(jobId, cancelled ? "cancelled" : "completed");
    return NextResponse.json({ totalGenerated, results, cancelled, rateLimited });
  } catch (err: any) {
    await finishJob(jobId, "cancelled");
    console.error("admin generate error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal generate." }, { status: 500 });
  }
}
