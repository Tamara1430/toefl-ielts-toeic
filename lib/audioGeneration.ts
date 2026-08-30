import { createAdminClient } from "@/lib/supabase/admin";
import { ORPHEUS_VOICE_POOL, EDGE_TTS_VOICE_POOL } from "@/lib/examConfig";
import { isJobCancelled, setJobProgress } from "@/lib/generationJobs";
import { synthesizeSpeech } from "@/lib/ttsProvider";

export interface DialogueTurn {
  speaker: string;
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

/** Assign a consistent voice pair (Groq + Edge fallback) per unique speaker,
 * round-robin, in order of first appearance — so whichever provider ends up
 * generating a given turn, the speaker's voice choice stays consistent. */
function assignVoices(turns: DialogueTurn[]): Map<string, { groq: string; edge: string }> {
  const map = new Map<string, { groq: string; edge: string }>();
  let i = 0;
  for (const t of turns) {
    if (!map.has(t.speaker)) {
      map.set(t.speaker, {
        groq: ORPHEUS_VOICE_POOL[i % ORPHEUS_VOICE_POOL.length],
        edge: EDGE_TTS_VOICE_POOL[i % EDGE_TTS_VOICE_POOL.length],
      });
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
