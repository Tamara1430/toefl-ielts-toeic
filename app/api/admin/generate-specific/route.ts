import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { topUpOne } from "@/lib/questionGeneration";
import { isJobCancelled, finishJob } from "@/lib/generationJobs";
import { ExamType, SectionType, Difficulty } from "@/lib/examConfig";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { exam, section, difficulty, count, jobId } = (await req.json()) as {
    exam: ExamType;
    section: SectionType;
    difficulty: Difficulty;
    count: number;
    jobId?: string;
  };

  if (!exam || !section || !difficulty || !count || count < 1) {
    return NextResponse.json({ error: "Field tidak lengkap atau count tidak valid." }, { status: 400 });
  }

  try {
    const { result, rateLimited } = await topUpOne(exam, section, difficulty, Math.min(count, 50), jobId);
    const cancelled = await isJobCancelled(jobId);
    await finishJob(jobId, cancelled ? "cancelled" : "completed");
    return NextResponse.json({ result, cancelled, rateLimited });
  } catch (err: any) {
    await finishJob(jobId, "cancelled");
    console.error("generate-specific error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal generate." }, { status: 500 });
  }
}
