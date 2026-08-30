import { getGroqClient } from "@/lib/groqClient";
import { GROQ_TTS_MODEL } from "@/lib/examConfig";
import { EdgeTTS } from "edge-tts-universal";

export interface TtsResult {
  buffer: Buffer;
  provider: "groq" | "edge";
  contentType: string;
  ext: string;
}

/**
 * Try Groq's Orpheus TTS first (best quality, expressive AI voice). If it
 * fails for ANY reason (rate limit, daily quota, network hiccup, terms not
 * accepted, model issue, etc), automatically fall back to Edge TTS — a free,
 * no-signup, no-rate-limit text-to-speech service using Microsoft's Neural
 * voices (the same engine behind Microsoft Edge's "Read Aloud" feature).
 *
 * Note: Edge TTS is a community-maintained wrapper around an undocumented
 * Microsoft service, not an officially published public API. It's widely
 * used and has no published rate limit, but isn't guaranteed stable long
 * term the way an official API is — that's an acceptable tradeoff here
 * since it's only ever the fallback, never primary.
 */
export async function synthesizeSpeech(
  text: string,
  groqVoice: string,
  edgeVoice: string
): Promise<TtsResult> {
  try {
    const groq = getGroqClient();
    const response = await groq.audio.speech.create({
      model: GROQ_TTS_MODEL,
      voice: groqVoice,
      input: text,
      response_format: "wav",
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    return { buffer, provider: "groq", contentType: "audio/wav", ext: "wav" };
  } catch (groqError: any) {
    console.error("Groq TTS gagal, fallback ke Edge TTS:", groqError?.message ?? groqError);
    try {
      const tts = new EdgeTTS(text, edgeVoice);
      const result = await tts.synthesize();
      const buffer = Buffer.from(await result.audio.arrayBuffer());
      return { buffer, provider: "edge", contentType: "audio/mpeg", ext: "mp3" };
    } catch (edgeError: any) {
      throw new Error(
        `Groq TTS gagal (${groqError?.message ?? groqError}) dan Edge TTS fallback juga gagal (${edgeError?.message ?? edgeError}).`
      );
    }
  }
}
