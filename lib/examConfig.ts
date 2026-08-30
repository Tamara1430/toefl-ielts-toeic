export type ExamType = "toefl" | "ielts" | "toeic";
export type SectionType = "reading" | "listening" | "speaking";
export type Difficulty = "beginner" | "intermediate" | "advanced";

export const EXAM_LABELS: Record<ExamType, string> = {
  toefl: "TOEFL iBT",
  ielts: "IELTS Academic",
  toeic: "TOEIC",
};

export const SECTION_LABELS: Record<SectionType, string> = {
  reading: "Reading (Soal Biasa)",
  listening: "Listening (Text-to-Speech)",
  speaking: "Speaking (Speech-to-Text)",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Pemula",
  intermediate: "Menengah",
  advanced: "Mahir",
};

// System prompt describing the exam "personality" so generated content matches the real test style.
export function examContext(exam: ExamType): string {
  switch (exam) {
    case "toefl":
      return "TOEFL iBT is an academic English test used mainly for US/international university admission. Reading passages are academic (science, history, social studies) ~250-350 words. Listening involves campus conversations or academic lectures. Speaking tasks include independent opinion tasks and integrated tasks.";
    case "ielts":
      return "IELTS Academic is used for university admission and immigration (UK/Australia/Canada style English). Reading passages are academic articles ~250-350 words with varied question types (True/False/Not Given style adapted to multiple choice here). Listening involves everyday and academic conversations. Speaking follows the 3-part IELTS speaking format (introduction, cue card / long turn, discussion).";
    case "toeic":
      return "TOEIC is a business/workplace English test. Reading passages are business documents: emails, memos, advertisements, notices, schedules. Listening involves workplace conversations, announcements, or short talks. Speaking tasks involve describing a picture, responding to workplace questions, or giving an opinion on a work-related topic.";
  }
}

// NOTE: llama-3.3-70b-versatile and playai-tts were both retired by Groq in 2026.
// Current replacements (check https://console.groq.com/docs/models if these change again):
export const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
export const GROQ_STT_MODEL = "whisper-large-v3-turbo";
export const GROQ_TTS_MODEL = "canopylabs/orpheus-v1-english";
// Available Orpheus English voices: autumn, diana, hannah, austin, daniel, troy
export const GROQ_TTS_VOICE = "autumn";
// Pool of distinct voices assigned round-robin to each speaker in a listening
// dialogue, so different speakers actually sound different.
export const ORPHEUS_VOICE_POOL = [
  "autumn",
  "austin",
  "diana",
  "troy",
  "hannah",
  "daniel",
] as const;

// Fallback TTS voices (Microsoft Edge neural voices via edge-tts-universal),
// used only when Groq TTS fails (rate limit/quota/etc). Same-length pool,
// alternating gender, indexed the same way as ORPHEUS_VOICE_POOL so a given
// speaker maps consistently to "voice #N" regardless of which provider ends
// up generating that particular turn.
export const EDGE_TTS_VOICE_POOL = [
  "en-US-AriaNeural",
  "en-US-GuyNeural",
  "en-US-JennyNeural",
  "en-US-DavisNeural",
  "en-US-EmmaNeural",
  "en-US-BrianNeural",
] as const;
