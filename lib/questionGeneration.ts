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

- If a dialogue fits the exam style better (most common), use exactly 2 distinct speakers with realistic roles that fit the context (e.g. "Woman", "Man", "Student", "Professor", "Customer", "Employee", or a first name like "Lisa" or "Mark").
- If a monologue fits better (e.g. an announcement, a short lecture excerpt, a voicemail), use exactly 1 speaker.
- Use 6-10 short turns for a dialogue (each turn 1-3 sentences) or 3-5 turns for a monologue, totaling roughly 100-180 words combined.
- Write the text the way people actually speak it aloud (natural phrasing, contractions where appropriate).
- Keep the same speaker label spelled identically every time they speak (e.g. always "Woman", never switch to "Female Speaker" partway through).
- For EVERY turn, declare that speaker's gender as "male" or "female" — pick whichever gender the character's name/role implies (e.g. "Lisa" → female, "Man" → male, "Professor" → your choice, but stay consistent). This is used to pick a matching voice, so it must be accurate and identical every time that same speaker appears.

Then write exactly 4 multiple-choice comprehension questions in the authentic style of this exam.

Return ONLY valid JSON (no markdown fences, no commentary) matching this exact schema:
{
  "title": string,
  "turns": [
    { "speaker": string, "gender": "male" | "female", "text": string }
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

/** Target pool size per (exam, section, difficulty) combo — top-up keeps going
 * until each combo reaches this, giving a much bigger buffer against Groq's
 * daily free-tier rate limit instead of stopping at a tiny stock.
 *
 * Bounded by Supabase's free-tier 1GB Storage cap (audio is the only heavy
 * part — question text itself is negligible even at thousands of rows): at
 * ~64KB/turn (mp3) × ~7 turns/question average, keeping every combo under
 * ~200 questions stays safely under 1GB across all 9 listening combos, with
 * headroom to spare. 150 leaves a comfortable double safety margin under
 * that ceiling. Reading/speaking combos cost nothing extra in Storage (no
 * audio), so the same target is fine for them too.
 *
 * Reaching this from empty takes many weeks on the free tier (see
 * TOP_UP_BATCH comment below) — that's expected, not a bug. */
export const MIN_POOL_SIZE = 150;
/**
 * How many questions to add per top-up run, per combo.
 *
 * Grounded in Groq's actual free-tier limits for openai/gpt-oss-120b (checked
 * Aug 2026): 200,000 tokens/day is the binding constraint (not the 1,000
 * requests/day figure) — each generation call uses roughly 1,000-2,000
 * tokens, so the realistic daily budget is only ~100-130 successful
 * generations TOTAL, across all 27 (exam × section × difficulty) combos.
 *
 * With 27 combos and a ~120/day budget, keeping this small (5) means one
 * full pass through every combo costs ~135 generations — close to a full
 * day's quota — so every combo gets a turn instead of the first few combos
 * in iteration order hogging the whole daily budget while later ones starve
 * for weeks. The hourly cron then spreads this pacing out naturally instead
 * of front-loading everything into one run.
 */
export const TOP_UP_BATCH = 5;

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

/** Detects a Groq rate-limit / daily-quota error so we can stop the whole run
 * cleanly instead of burning through every remaining combo with doomed calls. */
function isRateLimitError(e: any): boolean {
  const status = e?.status ?? e?.response?.status ?? e?.statusCode;
  const message = String(e?.message ?? e ?? "").toLowerCase();
  return (
    status === 429 ||
    message.includes("rate limit") ||
    message.includes("rate_limit") ||
    message.includes("quota") ||
    message.includes("too many requests")
  );
}

/**
 * Check every (exam, section, difficulty) combo's stock; generate a batch
 * for any combo below MIN_POOL_SIZE. No upper cap — pools only grow when
 * actually depleted below the threshold, so cost stays tied to real usage.
 * Used by both the manual "Generate Umum" admin action and the hourly cron.
 * Stops the whole run early (not just the current combo) if Groq's rate
 * limit/daily quota is detected, since every further call would fail too.
 */
export async function topUpAllPools(
  jobId?: string
): Promise<{ results: TopUpResult[]; rateLimited: boolean }> {
  const admin = createAdminClient();
  const results: TopUpResult[] = [];
  const startedAt = Date.now();
  let rateLimited = false;

  // Shuffle combo order each run — with Groq's daily quota often being the
  // real constraint (not per-run time), a FIXED order would mean the same
  // early combos (e.g. TOEFL/reading/beginner) always win the day's budget
  // while later ones (e.g. TOEIC/speaking/advanced) starve for weeks. A
  // shuffled order gives every combo a fair shot over multiple days.
  const combos: { exam: ExamType; section: SectionType; difficulty: Difficulty }[] = [];
  for (const exam of ALL_EXAMS) {
    for (const section of ALL_SECTIONS) {
      for (const difficulty of ALL_DIFFICULTIES) {
        combos.push({ exam, section, difficulty });
      }
    }
  }
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }

  outer: for (const { exam, section, difficulty } of combos) {
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
          if (isRateLimitError(e)) {
            rateLimited = true;
            results.push(result);
            break outer;
          }
        }
      }
    }

    results.push(result);
  }

  await setJobProgress(jobId, null);
  return { results, rateLimited };
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
): Promise<{ result: TopUpResult; rateLimited: boolean }> {
  const admin = createAdminClient();
  const startedAt = Date.now();
  let rateLimited = false;

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
      if (isRateLimitError(e)) {
        rateLimited = true;
        break;
      }
    }
  }

  await setJobProgress(jobId, null);
  return { result, rateLimited };
}
