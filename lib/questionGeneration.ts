import { getGroqClient } from "@/lib/groqClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndCacheListeningAudio } from "@/lib/audioGeneration";
import { isJobCancelled, setJobProgress } from "@/lib/generationJobs";
import {
  ExamType,
  SectionType,
  Difficulty,
  examContext,
  GROQ_TEXT_MODEL,
} from "@/lib/examConfig";

// --- Prompt builder (moved here from the old /api/generate route) ---

function buildPrompt(exam: ExamType, section: SectionType, difficulty: Difficulty) {
  const context = examContext(exam);

  if (section === "reading") {
    return `You are an expert ${exam.toUpperCase()} test item writer.
Context: ${context}
Difficulty: ${difficulty}.

Create ONE reading passage (180-320 words) with exactly 5 multiple-choice comprehension questions in the authentic style of this exam.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "title": string,
  "passage": string,
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number (0-3),
      "explanation": string
    }
  ]
}`;
  }

  if (section === "listening") {
    return `You are an expert ${exam.toUpperCase()} test item writer.
Context: ${context}
Difficulty: ${difficulty}.

Create ONE short listening scenario in the authentic style of this exam, structured as a sequence of spoken turns. This will be converted to audio via text-to-speech with a DIFFERENT voice per speaker, so speakers must be clearly distinguishable roles.

- If a dialogue fits the exam style better (most common), use exactly 2 distinct speakers with realistic roles that fit the context (e.g. "Woman", "Man", "Student", "Professor", "Customer", "Employee").
- If a monologue fits better (e.g. an announcement, a short lecture excerpt, a voicemail), use exactly 1 speaker.
- Use 6-10 short turns for a dialogue (each turn 1-3 sentences) or 3-5 turns for a monologue, totaling roughly 100-180 words combined.
- Write the text the way people actually speak it aloud (natural phrasing, contractions where appropriate).
- Keep the same speaker label spelled identically every time they speak (e.g. always "Woman", never switch to "Female Speaker" partway through).

Then write exactly 4 multiple-choice comprehension questions in the authentic style of this exam.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "title": string,
  "turns": [
    { "speaker": string, "text": string }
  ],
  "questions": [
    {
      "question": string,
      "options": [string, string, string, string],
      "correctIndex": number (0-3),
      "explanation": string
    }
  ]
}`;
  }

  // speaking
  return `You are an expert ${exam.toUpperCase()} test item writer.
Context: ${context}
Difficulty: ${difficulty}.

Create ONE speaking task prompt in the authentic style of this exam (e.g. TOEFL independent/integrated task, IELTS cue-card style, or TOEIC picture-description/opinion task). Include clear instructions and, if relevant, a short reading/listening stimulus the user should react to. Also include suggested preparation time and response time in seconds, and 3 short bullet tips on what a strong answer should include (used later to auto-grade the user's spoken response).

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "title": string,
  "prompt": string,
  "stimulus": string,
  "prepSeconds": number,
  "responseSeconds": number,
  "scoringTips": [string, string, string]
}`;
}

/** Generate ONE question via Groq and insert it into the question bank. */
export async function generateAndStoreQuestion(
  exam: ExamType,
  section: SectionType,
  difficulty: Difficulty
) {
  const groq = getGroqClient();
  const prompt = buildPrompt(exam, section, difficulty);

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a precise test-item generator. You always respond with strictly valid JSON only, matching the schema given by the user. Never wrap the JSON in markdown code fences.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const payload = JSON.parse(raw);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("questions")
    .insert({ exam, section, difficulty, payload })
    .select("id")
    .single();

  if (error) throw new Error(`Gagal simpan soal ke database: ${error.message}`);

  // Listening questions get their audio generated & cached right away, so the
  // very first user to play it doesn't hit a live Groq TTS call — and neither
  // does anyone after them, since the audio URL is now baked into the payload.
  if (section === "listening") {
    try {
      await generateAndCacheListeningAudio(data.id, payload);
    } catch (e) {
      // Don't fail question creation just because audio caching hiccuped —
      // DialoguePlayer falls back to live TTS, and the admin "Generate Voices"
      // button can backfill it later.
      console.error(`Audio caching failed for question ${data.id}:`, e);
    }
  }

  return data.id as string;
}

export const ALL_EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];
export const ALL_SECTIONS: SectionType[] = ["reading", "listening", "speaking"];
export const ALL_DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

/** Minimum pool size per (exam, section, difficulty) combo before auto top-up kicks in. */
export const MIN_POOL_SIZE = 12;
/** How many questions to add per top-up run, per combo (kept small to spread cost/time). */
export const TOP_UP_BATCH = 4;

export interface TopUpResult {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  before: number;
  generated: number;
  errors: string[];
}

// Stay comfortably under Vercel's function duration limit regardless of exact
// plan/config — if a run is taking too long, stop and let the next manual
// click or cron tick continue where it left off.
const TIME_BUDGET_MS = 250_000;

/**
 * Check every (exam, section, difficulty) combo's stock; generate a small batch
 * for any combo below MIN_POOL_SIZE. No upper cap — pools only grow when
 * actually depleted below the threshold, so cost stays tied to real usage.
 * Used by both the manual "Generate Umum" admin action and the hourly cron.
 */
export async function topUpAllPools(jobId?: string): Promise<TopUpResult[]> {
  const admin = createAdminClient();
  const results: TopUpResult[] = [];
  const startedAt = Date.now();

  outer: for (const exam of ALL_EXAMS) {
    for (const section of ALL_SECTIONS) {
      for (const difficulty of ALL_DIFFICULTIES) {
        if (Date.now() - startedAt > TIME_BUDGET_MS) break outer;
        if (await isJobCancelled(jobId)) break outer;

        const { count } = await admin
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("exam", exam)
          .eq("section", section)
          .eq("difficulty", difficulty);

        const before = count ?? 0;
        const result: TopUpResult = { exam, section, difficulty, before, generated: 0, errors: [] };

        if (before < MIN_POOL_SIZE) {
          for (let i = 0; i < TOP_UP_BATCH; i++) {
            if (Date.now() - startedAt > TIME_BUDGET_MS) break;
            // Checked BEFORE starting the next item — whatever's already
            // in-flight when cancel is clicked finishes normally and gets
            // saved; nothing new starts after that.
            if (await isJobCancelled(jobId)) break;
            await setJobProgress(jobId, {
              exam,
              section,
              difficulty,
              index: i + 1,
              total: TOP_UP_BATCH,
            });
            try {
              await generateAndStoreQuestion(exam, section, difficulty);
              result.generated++;
            } catch (e: any) {
              result.errors.push(e.message ?? String(e));
            }
          }
        }

        results.push(result);
      }
    }
  }

  await setJobProgress(jobId, null);
  return results;
}

/**
 * Generate a specific number of questions for ONE (exam, section, difficulty)
 * combo, regardless of MIN_POOL_SIZE — lets an admin prioritize a particular
 * combo (e.g. "I need TOEFL Listening Advanced questions right now") instead
 * of waiting for the general top-up to get to it.
 */
export async function topUpOne(
  exam: ExamType,
  section: SectionType,
  difficulty: Difficulty,
  count: number,
  jobId?: string
): Promise<TopUpResult> {
  const admin = createAdminClient();
  const startedAt = Date.now();

  const { count: existing } = await admin
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("exam", exam)
    .eq("section", section)
    .eq("difficulty", difficulty);

  const before = existing ?? 0;
  const result: TopUpResult = { exam, section, difficulty, before, generated: 0, errors: [] };

  for (let i = 0; i < count; i++) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) break;
    if (await isJobCancelled(jobId)) break;
    await setJobProgress(jobId, { exam, section, difficulty, index: i + 1, total: count });
    try {
      await generateAndStoreQuestion(exam, section, difficulty);
      result.generated++;
    } catch (e: any) {
      result.errors.push(e.message ?? String(e));
    }
  }

  await setJobProgress(jobId, null);
  return result;
}
