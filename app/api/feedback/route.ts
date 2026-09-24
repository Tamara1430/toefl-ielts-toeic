import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import { ExamType, examContext, GROQ_TEXT_MODEL } from "@/lib/examConfig";
import { withGroqUsage } from "@/lib/groqUsage";
import { withGroqRetry } from "@/lib/groqRetry";

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

    const completion = await withGroqRetry(() =>
      withGroqUsage(
        GROQ_TEXT_MODEL,
        groq.chat.completions.create({
          model: GROQ_TEXT_MODEL,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0.5,
          // GPT-OSS is a reasoning model — by default it burns a lot of
          // hidden "thinking" tokens before answering, which is what was
          // eating our 8K-tokens/minute free-tier budget so fast. This is
          // a simple grading task, not a hard reasoning problem, so "low"
          // is plenty and cuts token usage per call dramatically.
          reasoning_effort: "low",
          // Keep the JSON answer itself capped too, since we only need a
          // short structured response.
          max_completion_tokens: 700,
          response_format: { type: "json_object" },
        })
      )
    );

    const raw = completion.choices[0]?.message?.content ?? "{}";
    return NextResponse.json({ data: JSON.parse(raw) });
  } catch (err: any) {
    console.error("feedback error:", err);
    const isRateLimit = err?.status === 429;
    return NextResponse.json(
      {
        error: isRateLimit
          ? "Server AI lagi sibuk (banyak yang latihan bareng). Coba lagi dalam beberapa detik, ya."
          : err?.message ?? "Gagal menilai jawaban.",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
