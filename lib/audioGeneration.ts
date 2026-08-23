import { getGroqClient } from "@/lib/groqClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { GROQ_TTS_MODEL, ORPHEUS_VOICE_POOL } from "@/lib/examConfig";

export interface DialogueTurn {
  speaker: string;
  text: string;
  audioUrl?: string;
}

interface ListeningPayload {
  title: string;
  turns: DialogueTurn[];
  questions: unknown;
}

const BUCKET = "tts-audio";

/** Assign a consistent voice per unique speaker, round-robin, in order of first
 * appearance — same logic used as the old client-side fallback in DialoguePlayer. */
function assignVoices(turns: DialogueTurn[]): Map<string, string> {
  const map = new Map<string, string>();
  let i = 0;
  for (const t of turns) {
    if (!map.has(t.speaker)) {
      map.set(t.speaker, ORPHEUS_VOICE_POOL[i % ORPHEUS_VOICE_POOL.length]);
      i++;
    }
  }
  return map;
}

/**
 * Generate + upload audio for every turn in a listening question that doesn't
 * already have a cached audioUrl, then persist the updated payload (with URLs
 * baked in) back onto the question row. Safe to call repeatedly — turns that
 * already have audioUrl are skipped, so it's idempotent and resumable.
 */
export async function generateAndCacheListeningAudio(
  questionId: string,
  payload: ListeningPayload
): Promise<{ updated: boolean; errors: string[] }> {
  const turns = payload?.turns;
  if (!Array.isArray(turns) || turns.length === 0) {
    return { updated: false, errors: ["Soal ini tidak punya data 'turns' yang valid."] };
  }

  if (!turns.some((t) => !t.audioUrl)) {
    return { updated: false, errors: [] }; // already fully cached
  }

  const groq = getGroqClient();
  const admin = createAdminClient();
  const voiceMap = assignVoices(turns);
  const errors: string[] = [];

  for (let i = 0; i < turns.length; i++) {
    if (turns[i].audioUrl) continue;
    try {
      const voice = voiceMap.get(turns[i].speaker) ?? ORPHEUS_VOICE_POOL[0];
      const response = await groq.audio.speech.create({
        model: GROQ_TTS_MODEL,
        voice,
        input: turns[i].text,
        response_format: "wav",
      });
      const buffer = Buffer.from(await response.arrayBuffer());
      const path = `${questionId}/${i}.wav`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: "audio/wav", upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path);
      turns[i].audioUrl = publicUrlData.publicUrl;
    } catch (e: any) {
      errors.push(`Giliran ${i + 1} (${turns[i].speaker}): ${e.message ?? String(e)}`);
    }
  }

  const { error: updateError } = await admin
    .from("questions")
    .update({ payload: { ...payload, turns } })
    .eq("id", questionId);

  if (updateError) errors.push(`Gagal simpan payload: ${updateError.message}`);

  return { updated: true, errors };
}
