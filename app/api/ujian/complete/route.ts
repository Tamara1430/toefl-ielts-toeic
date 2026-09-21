import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";
import { ExamType } from "@/lib/examConfig";
import { computeCertificateScore } from "@/lib/scoreConversion";

export const runtime = "nodejs";

interface SectionResult {
  correct: number;
  total: number;
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;

  const body = (await req.json()) as {
    exam: ExamType;
    period: string;
    readingResults: SectionResult[];
    listeningResults: SectionResult[];
    speakingScores: number[];
  };

  const { exam, period, readingResults, listeningResults, speakingScores } = body;

  if (!exam || !period || !readingResults || !listeningResults || !speakingScores) {
    return NextResponse.json({ error: "Data hasil ujian tidak lengkap." }, { status: 400 });
  }

  const readingCorrect = readingResults.reduce((s, r) => s + r.correct, 0);
  const readingTotal = readingResults.reduce((s, r) => s + r.total, 0);
  const listeningCorrect = listeningResults.reduce((s, r) => s + r.correct, 0);
  const listeningTotal = listeningResults.reduce((s, r) => s + r.total, 0);
  const speakingAvg = speakingScores.length
    ? Math.round(speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length)
    : 0;

  const readingPct = readingTotal > 0 ? (readingCorrect / readingTotal) * 100 : 0;
  const listeningPct = listeningTotal > 0 ? (listeningCorrect / listeningTotal) * 100 : 0;

  const score = computeCertificateScore(exam, readingPct, listeningPct, speakingAvg);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_attempts")
    .insert({
      user_id: user.id,
      exam,
      exam_period: period,
      reading_correct: readingCorrect,
      reading_total: readingTotal,
      listening_correct: listeningCorrect,
      listening_total: listeningTotal,
      speaking_score: speakingAvg,
      score_label: score.primary,
      score_breakdown: score,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ attemptId: data.id, score });
}
