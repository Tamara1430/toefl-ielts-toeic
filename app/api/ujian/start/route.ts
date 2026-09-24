import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";
import { shuffleQuestionOptions } from "@/lib/shuffleQuestion";
import { ExamType, SectionType, UJIAN_SECTION_TARGETS } from "@/lib/examConfig";
import { getEntitlement, canAccessUjian, Entitlements } from "@/lib/entitlements";
import { currentExamPeriod } from "@/lib/examPool";

export const runtime = "nodejs";

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const i = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(i, 1)[0]);
  }
  return picked;
}

/**
 * Picks up to `target` questions for one section, preferring ones this user
 * hasn't seen yet. Falls back to already-seen ones only when there aren't
 * enough fresh questions to fill the target — an Ujian session should never
 * be blocked just because the user has seen everything in the bank before.
 */
function pickForSection<T extends { id: string }>(
  candidates: T[],
  seenIds: Set<string>,
  target: number
): T[] {
  const unseen = candidates.filter((q) => !seenIds.has(q.id));
  const seen = candidates.filter((q) => seenIds.has(q.id));
  const fromUnseen = pickRandom(unseen, target);
  if (fromUnseen.length >= target) return fromUnseen;
  const remaining = target - fromUnseen.length;
  return [...fromUnseen, ...pickRandom(seen, remaining)];
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
  const targets = UJIAN_SECTION_TARGETS[exam];

  // Ujian draws straight from the same advanced-difficulty ("Mahir") bank
  // used for Latihan — no separate monthly-only "exam" pool to keep topped
  // up. Any advanced question for this exam, from any pool, is fair game.
  const { data: bank, error: poolError } = await supabase
    .from("questions")
    .select("id, section, payload")
    .eq("exam", exam)
    .eq("difficulty", "advanced");

  if (poolError) return NextResponse.json({ error: poolError.message }, { status: 500 });

  const { data: seenRows } = await supabase
    .from("user_seen_questions")
    .select("question_id")
    .eq("user_id", user.id);
  const seenIds = new Set((seenRows ?? []).map((r) => r.question_id as string));

  const bySection = (section: SectionType) => (bank ?? []).filter((q) => q.section === section);

  const readingCandidates = bySection("reading");
  const speakingCandidates = bySection("speaking");

  // Listening only counts if its audio is fully cached — a question mid TTS
  // generation can't be played yet.
  const listeningCandidates = bySection("listening").filter((q) => {
    const turns = (q.payload as any)?.turns;
    return Array.isArray(turns) && turns.length > 0 && turns.every((t: any) => t.audioUrl);
  });

  if (readingCandidates.length === 0 || listeningCandidates.length === 0 || speakingCandidates.length === 0) {
    const empty: string[] = [];
    if (readingCandidates.length === 0) empty.push("Reading");
    if (listeningCandidates.length === 0) empty.push("Listening (audio siap)");
    if (speakingCandidates.length === 0) empty.push("Speaking");
    return NextResponse.json({
      notReady: true,
      message: `Soal Ujian ${exam.toUpperCase()} tingkat Mahir belum tersedia untuk: ${empty.join(
        ", "
      )}. Minta admin generate soal Mahir untuk bagian ini dulu.`,
    });
  }

  const reading = pickForSection(readingCandidates, seenIds, targets.reading);
  const listening = pickForSection(listeningCandidates, seenIds, targets.listening);
  const speaking = pickForSection(speakingCandidates, seenIds, targets.speaking);

  const shuffledReading = reading.map((q) => ({
    id: q.id,
    payload: { ...q.payload, questions: shuffleQuestionOptions((q.payload as any).questions) },
  }));
  const shuffledListening = listening.map((q) => ({
    id: q.id,
    payload: { ...q.payload, questions: shuffleQuestionOptions((q.payload as any).questions) },
  }));

  // Best-effort: remember these as "seen" so future Ujian/Latihan sessions
  // prefer fresh questions first. Never block the exam if this write fails.
  const allPickedIds = [...reading, ...listening, ...speaking].map((q) => q.id);
  if (allPickedIds.length > 0) {
    await supabase
      .from("user_seen_questions")
      .upsert(
        allPickedIds.map((question_id) => ({ user_id: user.id, question_id })),
        { onConflict: "user_id,question_id", ignoreDuplicates: true }
      );
  }

  return NextResponse.json({
    exam,
    period,
    reading: shuffledReading,
    listening: shuffledListening,
    speaking: speaking.map((q) => ({ id: q.id, payload: q.payload })),
  });
}
