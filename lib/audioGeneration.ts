import { createAdminClient } from "@/lib/supabase/admin";
import {
  ORPHEUS_VOICE_POOL,
  ORPHEUS_VOICE_POOL_MALE,
  ORPHEUS_VOICE_POOL_FEMALE,
  EDGE_TTS_VOICE_POOL,
  EDGE_TTS_VOICE_POOL_MALE,
  EDGE_TTS_VOICE_POOL_FEMALE,
} from "@/lib/examConfig";
import { isJobCancelled, setJobProgress } from "@/lib/generationJobs";
import { synthesizeSpeech } from "@/lib/ttsProvider";

export interface DialogueTurn {
  speaker: string;
  gender?: "male" | "female";
  text: string;
  audioUrl?: string;
  ttsProvider?: "groq" | "edge";
}

interface ListeningPayload {
  title: string;
  turns: DialogueTurn[];
  questions: unknown;
}

const BUCKET = "tts-audio";

/**
 * Assign a consistent voice pair (Groq + Edge fallback) per unique speaker.
 *
 * Gender-aware: if the turn declares a gender (from newer generations, where
 * the AI is asked to specify it), pick from that gender's dedicated voice
 * pool — so "Lisa" always gets a female voice, "Man" always gets a male one,
 * regardless of who happens to speak first. This fixes voices getting
 * mismatched to the wrong gender based on speaking order alone.
 *
 * Falls back to the old combined alternating pool (round-robin, gender
 * agnostic) for older questions generated before the `gender` field existed.
 */
function assignVoices(turns: DialogueTurn[]): Map<string, { groq: string; edge: string }> {
  const map = new Map<string, { groq: string; edge: string }>();
  let maleIndex = 0;
  let femaleIndex = 0;
  let fallbackIndex = 0;

  for (const t of turns) {
    if (map.has(t.speaker)) continue;

    if (t.gender === "male") {
      map.set(t.speaker, {
        groq: ORPHEUS_VOICE_POOL_MALE[maleIndex % ORPHEUS_VOICE_POOL_MALE.length],
        edge: EDGE_TTS_VOICE_POOL_MALE[maleIndex % EDGE_TTS_VOICE_POOL_MALE.length],
      });
      maleIndex++;
    } else if (t.gender === "female") {
      map.set(t.speaker, {
        groq: ORPHEUS_VOICE_POOL_FEMALE[femaleIndex % ORPHEUS_VOICE_POOL_FEMALE.length],
        edge: EDGE_TTS_VOICE_POOL_FEMALE[femaleIndex % EDGE_TTS_VOICE_POOL_FEMALE.length],
      });
      femaleIndex++;
    } else {
      // No gender declared (older question) — fall back to the previous
      // gender-agnostic alternating behavior.
      map.set(t.speaker, {
        groq: ORPHEUS_VOICE_POOL[fallbackIndex % ORPHEUS_VOICE_POOL.length],
        edge: EDGE_TTS_VOICE_POOL[fallbackIndex % EDGE_TTS_VOICE_POOL.length],
      });
      fallbackIndex++;
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
  payload: ListeningPayload,
  jobId?: string
): Promise<{ updated: boolean; errors: string[] }> {
  const turns = payload?.turns;
  if (!Array.isArray(turns) || turns.length === 0) {
    return { updated: false, errors: ["Soal ini tidak punya data 'turns' yang valid."] };
  }

  if (!turns.some((t) => !t.audioUrl)) {
    return { updated: false, errors: [] }; // already fully cached
  }

  const admin = createAdminClient();
  const voiceMap = assignVoices(turns);
  const errors: string[] = [];

  for (let i = 0; i < turns.length; i++) {
    if (turns[i].audioUrl) continue;
    // Checked BEFORE starting the next turn's TTS call — the turn currently
    // being generated (if any) always finishes and gets saved; nothing new
    // starts after cancel is clicked. Whatever's completed so far is still
    // persisted below, so the next "Generate Voices" run picks up the rest.
    if (await isJobCancelled(jobId)) break;
    await setJobProgress(jobId, {
      questionId,
      title: payload.title,
      speaker: turns[i].speaker,
      turnIndex: i + 1,
      totalTurns: turns.length,
    });
    try {
      const voices = voiceMap.get(turns[i].speaker) ?? {
        groq: ORPHEUS_VOICE_POOL[0],
        edge: EDGE_TTS_VOICE_POOL[0],
      };
      const { buffer, provider, contentType, ext } = await synthesizeSpeech(
        turns[i].text,
        voices.groq,
        voices.edge
      );
      const path = `${questionId}/${i}.${ext}`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType, upsert: true });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(path);
      turns[i].audioUrl = publicUrlData.publicUrl;
      turns[i].ttsProvider = provider;
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
