import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;

  const body = await req.json();
  const { exam, section, difficulty, questionId, title, correct, total, speakingScore, speakingScale } =
    body;

  if (!exam || !section || !difficulty) {
    return NextResponse.json({ error: "Field tidak lengkap." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("practice_sessions").insert({
    user_id: user.id,
    exam,
    section,
    difficulty,
    question_id: questionId ?? null,
    title: title ?? null,
    correct: correct ?? null,
    total: total ?? null,
    speaking_score: speakingScore ?? null,
    speaking_scale: speakingScale ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
