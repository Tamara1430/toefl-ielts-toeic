import { createClient } from "./supabase/client";
import { ExamType, SectionType, Difficulty } from "./examConfig";

export interface HistoryRecord {
  id: string;
  timestamp: number;
  section: SectionType;
  difficulty: Difficulty;
  title?: string;
  correct?: number;
  total?: number;
  speakingScore?: number;
  speakingScale?: string;
}

export interface MergedHistoryRecord extends HistoryRecord {
  exam: ExamType;
}

function mapRow(row: any): MergedHistoryRecord {
  return {
    id: row.id,
    timestamp: new Date(row.created_at).getTime(),
    exam: row.exam,
    section: row.section,
    difficulty: row.difficulty,
    title: row.title ?? undefined,
    correct: row.correct ?? undefined,
    total: row.total ?? undefined,
    speakingScore: row.speaking_score ?? undefined,
    speakingScale: row.speaking_scale ?? undefined,
  };
}

/** History for a single exam (current logged-in user only, enforced by RLS). */
export async function getHistory(exam: ExamType): Promise<HistoryRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("exam", exam)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data ?? []).map(mapRow);
}

/** Combined history across TOEFL, IELTS, and TOEIC for the current user. */
export async function getAllHistory(): Promise<MergedHistoryRecord[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("practice_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  return (data ?? []).map(mapRow);
}

/** Record a completed practice session (reading/listening score or speaking score). */
export async function recordSession(params: {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  questionId?: string;
  title?: string;
  correct?: number;
  total?: number;
  speakingScore?: number;
  speakingScale?: string;
}) {
  try {
    await fetch("/api/practice/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch {
    // Non-critical — history recording failing shouldn't block the practice UI.
  }
}
