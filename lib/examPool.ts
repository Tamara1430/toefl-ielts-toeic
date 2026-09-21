import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndStoreQuestion, ALL_EXAMS, ALL_SECTIONS } from "@/lib/questionGeneration";

/** Current exam period, e.g. "2026-09" — the Ujian pool rotates once this changes. */
export function currentExamPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** How many exam-pool questions to keep in stock per (exam, section) for the
 * current period. Small on purpose — this pool is for a handful of exam
 * sessions per month, not for daily Latihan volume. */
const EXAM_POOL_TARGET = 6;

export interface ExamPoolTopUpResult {
  exam: string;
  section: string;
  period: string;
  before: number;
  generated: number;
  errors: string[];
}

/**
 * Ensures the current month's exam pool has enough advanced-difficulty
 * questions per (exam, section). Safe to call repeatedly — only tops up
 * what's missing, never duplicates past the target.
 */
export async function topUpExamPool(): Promise<ExamPoolTopUpResult[]> {
  const admin = createAdminClient();
  const period = currentExamPeriod();
  const results: ExamPoolTopUpResult[] = [];

  for (const exam of ALL_EXAMS) {
    for (const section of ALL_SECTIONS) {
      const { count } = await admin
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("exam", exam)
        .eq("section", section)
        .eq("pool", "exam")
        .eq("exam_period", period);

      const before = count ?? 0;
      const result: ExamPoolTopUpResult = { exam, section, period, before, generated: 0, errors: [] };

      const missing = EXAM_POOL_TARGET - before;
      for (let i = 0; i < missing; i++) {
        try {
          await generateAndStoreQuestion(exam, section, "advanced", { pool: "exam", examPeriod: period });
          result.generated++;
        } catch (e: any) {
          result.errors.push(e.message ?? String(e));
        }
      }

      results.push(result);
    }
  }

  return results;
}
