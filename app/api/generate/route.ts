import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import {
  ExamType,
  SectionType,
  Difficulty,
  examContext,
  GROQ_TEXT_MODEL,
} from "@/lib/examConfig";

export const runtime = "nodejs";

interface GenerateBody {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
}

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { exam, section, difficulty } = body;

    if (!exam || !section || !difficulty) {
      return NextResponse.json(
        { error: "Field exam, section, dan difficulty wajib diisi." },
        { status: 400 }
      );
    }

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
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({ data: parsed });
  } catch (err: any) {
    console.error("generate error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Gagal generate soal." },
      { status: 500 }
    );
  }
}
