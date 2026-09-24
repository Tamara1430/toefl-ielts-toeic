import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import { GROQ_STT_MODEL } from "@/lib/examConfig";
import { withGroqUsage } from "@/lib/groqUsage";
import { withGroqRetry } from "@/lib/groqRetry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File audio wajib diupload." }, { status: 400 });
    }

    const groq = getGroqClient();

    const transcription = await withGroqRetry(() =>
      withGroqUsage(
        GROQ_STT_MODEL,
        groq.audio.transcriptions.create({
          file,
          model: GROQ_STT_MODEL,
          response_format: "verbose_json",
          language: "en",
        })
      )
    );

    return NextResponse.json({ text: transcription.text, raw: transcription });
  } catch (err: any) {
    console.error("stt error:", err);
    const isRateLimit = err?.status === 429;
    return NextResponse.json(
      {
        error: isRateLimit
          ? "Server AI lagi sibuk (banyak yang latihan bareng). Coba lagi dalam beberapa detik, ya."
          : err?.message ?? "Gagal transkrip audio (STT).",
      },
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
