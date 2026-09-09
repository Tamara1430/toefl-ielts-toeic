import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";
import { shuffleQuestionOptions } from "@/lib/shuffleQuestion";
import { ExamType, SectionType } from "@/lib/examConfig";
import { getEntitlement, hasUnlimitedLatihan, Entitlements } from "@/lib/entitlements";
import { getFreeTierQuestionIds } from "@/lib/practiceQuestions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;

  const { exam, section } = (await req.json()) as {
    exam: ExamType;
    section: SectionType;
  };

  if (!exam || !section) {
    return NextResponse.json({ error: "Field tidak lengkap." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("entitlements")
    .eq("id", user.id)
    .single();

  const level = getEntitlement(profile?.entitlements as Entitlements, exam);
  const unlimited = hasUnlimitedLatihan(level);

  // Questions this user has already seen — the question row itself already
  // scopes exam/section, so no extra filter needed here.
  const { data: seenRows } = await supabase
    .from("user_seen_questions")
    .select("question_id")
    .eq("user_id", user.id);
  const seenIds = new Set((seenRows ?? []).map((r) => r.question_id as string));

  let pool: { id: string; payload: any; difficulty: string }[] = [];

  if (unlimited) {
    // Premium for this exam — pull from the whole bank, any difficulty
    // (Latihan no longer separates by difficulty level).
    const { data, error: poolError } = await supabase
      .from("questions")
      .select("id, payload, difficulty")
      .eq("exam", exam)
      .eq("section", section);
    if (poolError) return NextResponse.json({ error: poolError.message }, { status: 500 });
    pool = data ?? [];
  } else {
    // Free tier (or ujian-only, which doesn't include unlimited Latihan) —
    // restricted to a small, FIXED set of the oldest questions. Every free
    // account sees the exact same set, so a new account gains nothing new.
    const freeIds = await getFreeTierQuestionIds(exam, section);
    if (freeIds.length === 0) {
      return NextResponse.json({ outOfStock: true });
    }
    const { data, error: poolError } = await supabase
      .from("questions")
      .select("id, payload, difficulty")
      .in("id", freeIds);
    if (poolError) return NextResponse.json({ error: poolError.message }, { status: 500 });
    pool = data ?? [];
  }

  const candidates = pool.filter((q) => !seenIds.has(q.id));

  if (candidates.length === 0) {
    if (!unlimited) {
      // Free-tier quota exhausted for this exam+section specifically.
      return NextResponse.json({ quotaExceeded: true, exam, section });
    }
    return NextResponse.json({ outOfStock: true });
  }

  let pickPool = candidates;

  if (section === "listening") {
    // Only serve questions whose audio is fully cached — never a question
    // whose audio is still mid-generation/incomplete, even if it means
    // showing an alert instead.
    const audioReady = candidates.filter((q) => {
      const turns = (q.payload as any)?.turns;
      return Array.isArray(turns) && turns.length > 0 && turns.every((t: any) => t.audioUrl);
    });

    if (audioReady.length === 0) {
      return NextResponse.json({ audioPending: true });
    }

    pickPool = audioReady;
  }

  const picked = pickPool[Math.floor(Math.random() * pickPool.length)];
  const payload = picked.payload as any;

  if (payload.questions) {
    payload.questions = shuffleQuestionOptions(payload.questions);
  }

  await supabase
    .from("user_seen_questions")
    .insert({ user_id: user.id, question_id: picked.id })
    .select()
    .single();

  return NextResponse.json({ questionId: picked.id, data: payload, difficulty: picked.difficulty });
}
