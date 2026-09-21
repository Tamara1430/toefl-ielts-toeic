import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";
import { shuffleQuestionOptions } from "@/lib/shuffleQuestion";
import { ExamType } from "@/lib/examConfig";
import { getEntitlement, canAccessUjian, Entitlements } from "@/lib/entitlements";
import { currentExamPeriod } from "@/lib/examPool";

export const runtime = "nodejs";

const ITEMS_PER_SECTION = 2;

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(i, 1)[0]);
  }
  return picked;
}

export async function POST(req: NextRequest) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { user } = auth;

  const { exam } = (await req.json()) as { exam: ExamType };
  if (!exam) return NextResponse.json({ error: "Field exam wajib diisi." }, { status: 400 });

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("entitlements")
    .eq("id", user.id)
    .single();

  const level = getEntitlement(profile?.entitlements as Entitlements, exam);
  if (!canAccessUjian(level)) {
    return NextResponse.json(
      { error: "Akun kamu belum punya akses Ujian untuk exam ini.", needsUpgrade: true },
      { status: 403 }
    );
  }

  const period = currentExamPeriod();

  const { data: pool, error: poolError } = await supabase
    .from("questions")
    .select("id, section, payload")
    .eq("exam", exam)
    .eq("pool", "exam")
    .eq("exam_period", period);

  if (poolError) return NextResponse.json({ error: poolError.message }, { status: 500 });

  const reading = pickRandom((pool ?? []).filter((q) => q.section === "reading"), ITEMS_PER_SECTION);
  const listening = pickRandom((pool ?? []).filter((q) => q.section === "listening"), ITEMS_PER_SECTION);
  const speaking = pickRandom((pool ?? []).filter((q) => q.section === "speaking"), ITEMS_PER_SECTION);

  if (reading.length === 0 || listening.length === 0 || speaking.length === 0) {
    return NextResponse.json({
      notReady: true,
      message: "Soal Ujian bulan ini belum siap. Coba lagi nanti atau hubungi admin.",
    });
  }

  const listeningReady = listening.filter((q) => {
    const turns = (q.payload as any)?.turns;
    return Array.isArray(turns) && turns.length > 0 && turns.every((t: any) => t.audioUrl);
  });
  if (listeningReady.length === 0) {
    return NextResponse.json({
      notReady: true,
      message: "Audio soal Listening Ujian bulan ini belum siap. Coba lagi nanti.",
    });
  }

  const shuffledReading = reading.map((q) => ({
    id: q.id,
    payload: { ...q.payload, questions: shuffleQuestionOptions((q.payload as any).questions) },
  }));
  const shuffledListening = listeningReady.map((q) => ({
    id: q.id,
    payload: { ...q.payload, questions: shuffleQuestionOptions((q.payload as any).questions) },
  }));

  return NextResponse.json({
    exam,
    period,
    reading: shuffledReading,
    listening: shuffledListening,
    speaking: speaking.map((q) => ({ id: q.id, payload: q.payload })),
  });
}
