import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fixGenderForQuestion } from "@/lib/fixGender";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_QUESTIONS_PER_RUN = 8;
const TIME_BUDGET_MS = 250_000;

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data: listeningQs, error } = await admin
    .from("questions")
    .select("id, payload, created_at")
    .eq("section", "listening")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const needsFix = (listeningQs ?? []).filter((q) => {
    const turns = (q.payload as any)?.turns;
    return Array.isArray(turns) && turns.some((t: any) => !t.gender);
  });

  const startedAt = Date.now();
  let processed = 0;
  const errors: string[] = [];

  for (const q of needsFix) {
    if (processed >= MAX_QUESTIONS_PER_RUN) break;
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;

    const result = await fixGenderForQuestion(q.id, q.payload as any);
    if (result.errors.length) {
      errors.push(...result.errors.map((e) => `[${q.id.slice(0, 8)}] ${e}`));
    }
    processed++;
  }

  return NextResponse.json({
    totalNeeding: needsFix.length,
    processed,
    remaining: needsFix.length - processed,
    errors,
  });
}
