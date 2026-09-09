import { createClient } from "@/lib/supabase/server";
import { ExamType, SectionType } from "@/lib/examConfig";
import { FREE_TIER_LIMITS } from "@/lib/entitlements";

/**
 * The free tier always draws from the OLDEST N questions per (exam, section),
 * ordered by created_at ascending. This set is stable over time — as the
 * bank grows, new questions are always newer, so they never enter the free
 * set. This is deliberate: a fresh account gets the exact same fixed
 * question set as every other free account, so creating a new account to
 * dodge the quota gains nothing.
 */
export async function getFreeTierQuestionIds(
  exam: ExamType,
  section: SectionType
): Promise<string[]> {
  const supabase = await createClient();
  const limit = FREE_TIER_LIMITS[section];

  const { data } = await supabase
    .from("questions")
    .select("id")
    .eq("exam", exam)
    .eq("section", section)
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((r) => r.id as string);
}
