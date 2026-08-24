import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndCacheListeningAudio } from "@/lib/audioGeneration";
import { isJobCancelled, finishJob, setJobProgress } from "@/lib/generationJobs";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_QUESTIONS_PER_RUN = 8;
const TIME_BUDGET_MS = 250_000;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const jobId: string | undefined = body?.jobId;

  const admin = createAdminClient();
  const { data: listeningQs, error } = await admin
    .from("questions")
    .select("id, payload")
    .eq("section", "listening");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const needsAudio = (listeningQs ?? []).filter((q) => {
    const turns = (q.payload as any)?.turns;
    return Array.isArray(turns) && turns.some((t: any) => !t.audioUrl);
  });

  const startedAt = Date.now();
  let processed = 0;
  let cancelled = false;
  const errors: string[] = [];

  for (const q of needsAudio) {
    if (processed >= MAX_QUESTIONS_PER_RUN) break;
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    // Checked BEFORE starting the next question's audio — whichever question
    // is currently mid-generation always finishes and saves normally.
    if (await isJobCancelled(jobId)) {
      cancelled = true;
      break;
    }

    const result = await generateAndCacheListeningAudio(q.id, q.payload as any, jobId);
    if (result.errors.length) {
      errors.push(...result.errors.map((e) => `[${q.id.slice(0, 8)}] ${e}`));
    }
    processed++;
  }

  const remaining = needsAudio.length - processed;

  if (jobId) {
    if (cancelled) await finishJob(jobId, "cancelled");
    else if (remaining === 0) await finishJob(jobId, "completed");
    else await setJobProgress(jobId, null); // batch done, clear until next batch starts
  }

  return NextResponse.json({
    totalNeeding: needsAudio.length,
    processed,
    remaining,
    errors,
    cancelled,
  });
}
