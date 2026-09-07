import { getGroqClient } from "@/lib/groqClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { GROQ_TEXT_MODEL } from "@/lib/examConfig";
import { generateAndCacheListeningAudio, DialogueTurn } from "@/lib/audioGeneration";

interface ListeningPayload {
  title: string;
  turns: DialogueTurn[];
  questions: unknown;
}

/**
 * Cheap classification call — just asks the model to guess each speaker's
 * gender from their name/role. Roughly ~150 tokens vs ~1,500 for a full
 * question regeneration, since we're not asking it to write anything new.
 */
async function classifySpeakerGenders(
  speakers: string[],
  sampleTexts: Record<string, string>
): Promise<Record<string, "male" | "female">> {
  const groq = getGroqClient();

  const prompt = `Given these speaker labels from an English dialogue, classify each as "male" or "female" based on their name or role. If a label is a first name (e.g. "Lisa"), infer from the name. If it's an explicit role like "Man"/"Woman"/"Customer", use whatever gender that role/name implies — if genuinely ambiguous, make a reasonable guess and be consistent.

Speakers: ${JSON.stringify(speakers)}
One example line each speaker said, for context: ${JSON.stringify(sampleTexts)}

Return ONLY valid JSON (no markdown fences, no commentary): an object mapping every speaker label above to "male" or "female".`;

  const completion = await groq.chat.completions.create({
    model: GROQ_TEXT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You classify speaker names/roles by likely gender. Respond with strict JSON only, no commentary.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

/**
 * Fixes ONE listening question that's missing gender data: classifies each
 * unique speaker's gender (cheap AI call, question text untouched), clears
 * the old (possibly gender-mismatched) cached audio, and immediately
 * regenerates it using the now-correct gender-matched voices.
 */
export async function fixGenderForQuestion(
  questionId: string,
  payload: ListeningPayload
): Promise<{ fixed: boolean; errors: string[] }> {
  const turns = payload?.turns;
  if (!Array.isArray(turns) || turns.length === 0) {
    return { fixed: false, errors: ["Soal ini tidak punya data 'turns' yang valid."] };
  }

  const needsFix = turns.some((t) => !t.gender);
  if (!needsFix) return { fixed: false, errors: [] };

  const uniqueSpeakers = Array.from(new Set(turns.map((t) => t.speaker)));
  const sampleTexts: Record<string, string> = {};
  for (const speaker of uniqueSpeakers) {
    const example = turns.find((t) => t.speaker === speaker);
    if (example) sampleTexts[speaker] = example.text;
  }

  const errors: string[] = [];
  let genderMap: Record<string, "male" | "female"> = {};
  try {
    genderMap = await classifySpeakerGenders(uniqueSpeakers, sampleTexts);
  } catch (e: any) {
    return { fixed: false, errors: [`Gagal klasifikasi gender: ${e.message ?? e}`] };
  }

  // Clear old audioUrl/ttsProvider too — the previously cached audio may have
  // used the wrong-gender voice, so it needs regenerating either way.
  const updatedTurns: DialogueTurn[] = turns.map((t) => ({
    speaker: t.speaker,
    text: t.text,
    gender: genderMap[t.speaker] ?? t.gender ?? "female",
  }));

  const admin = createAdminClient();
  const updatedPayload = { ...payload, turns: updatedTurns };
  const { error: updateError } = await admin
    .from("questions")
    .update({ payload: updatedPayload })
    .eq("id", questionId);

  if (updateError) {
    return { fixed: false, errors: [`Gagal simpan gender: ${updateError.message}`] };
  }

  const audioResult = await generateAndCacheListeningAudio(questionId, updatedPayload);
  errors.push(...audioResult.errors);

  return { fixed: true, errors };
}
