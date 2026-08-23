import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import { ExamType, examContext, GROQ_TEXT_MODEL } from "@/lib/examConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { exam, prompt, transcript, scoringTips } = (await req.json()) as {
      exam: ExamType;
      prompt: string;
      transcript: string;
      scoringTips: string[];
    };

    if (!transcript || transcript.trim().length < 2) {
      return NextResponse.json(
        { error: "Transkrip kosong, coba rekam jawabanmu dulu." },
        { status: 400 }
      );
    }

    const groq = getGroqClient();

    const sys = `You are a strict but encouraging ${exam.toUpperCase()} speaking examiner. Context: ${examContext(
      exam
    )} You grade a candidate's spoken response (given as a transcript) against the task prompt and scoring criteria. Respond ONLY with valid JSON, no markdown fences.`;

    const user = `Task prompt: ${prompt}
Scoring criteria: ${scoringTips.join("; ")}
Candidate transcript: "${transcript}"

Return JSON with schema:
{
  "score": number (0-100, representing overall performance as a percentage of a strong native-level answer — this must always be on a 0-100 scale regardless of the exam, so scores are comparable across sessions over time),
  "scoreScaleNote": string (briefly note what this roughly corresponds to on the exam's real scale, e.g. "~IELTS band 6.5" or "~TOEFL Speaking 22/30"),
  "strengths": [string, string],
  "improvements": [string, string, string],
  "correctedSample": string (a short improved version of an ideal answer, 2-4 sentences)
}`;

    const completion = await groq.chat.completions.create({
      model: GROQ_TEXT_MODEL,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      temperature: 0.5,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch (err: any) {
    console.error("feedback error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Gagal menilai jawaban." },
      { status: 500 }
    );
  }
}
