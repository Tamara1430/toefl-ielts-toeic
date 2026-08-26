import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";
import { shuffleQuestionOptions } from "@/lib/shuffleQuestion";
import { ExamType, SectionType, Difficulty } from "@/lib/examConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;

  const { exam, section, difficulty } = (await req.json()) as {
    exam: ExamType;
    section: SectionType;
    difficulty: Difficulty;
  };

  if (!exam || !section || !difficulty) {
    return NextResponse.json({ error: "Field tidak lengkap." }, { status: 400 });
  }

  const supabase = await createClient();

  // Questions this user has already seen (any exam/section/difficulty — the
  // question row itself already scopes those, so no extra filter needed).
  const { data: seenRows } = await supabase
    .from("user_seen_questions")
    .select("question_id")
    .eq("user_id", user.id);
  const seenIds = new Set((seenRows ?? []).map((r) => r.question_id as string));

  const { data: pool, error: poolError } = await supabase
    .from("questions")
    .select("id, payload")
    .eq("exam", exam)
    .eq("section", section)
    .eq("difficulty", difficulty);

  if (poolError) {
    return NextResponse.json({ error: poolError.message }, { status: 500 });
  }

  const candidates = (pool ?? []).filter((q) => !seenIds.has(q.id));

  if (candidates.length === 0) {
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
      // There ARE unseen questions here, they just don't have audio ready yet —
      // distinct from true "no questions left at all" (outOfStock below).
      return NextResponse.json({ audioPending: true });
    }

    pickPool = audioReady;
  }

  const picked = pickPool[Math.floor(Math.random() * pickPool.length)];
  const payload = picked.payload as any;

  // Shuffle MCQ options for reading/listening so repeats (across users) feel fresh.
  if (payload.questions) {
    payload.questions = shuffleQuestionOptions(payload.questions);
  }

  // Mark as seen immediately (viewing counts, not just completing) so it won't repeat.
  await supabase
    .from("user_seen_questions")
    .insert({ user_id: user.id, question_id: picked.id })
    .select()
    .single();

  return NextResponse.json({ questionId: picked.id, data: payload });
}
