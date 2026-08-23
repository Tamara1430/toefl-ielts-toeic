import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import { GROQ_STT_MODEL } from "@/lib/examConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File audio wajib diupload." }, { status: 400 });
    }

    const groq = getGroqClient();

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: GROQ_STT_MODEL,
      response_format: "verbose_json",
      language: "en",
    });

    return NextResponse.json({ text: transcription.text, raw: transcription });
  } catch (err: any) {
    console.error("stt error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Gagal transkrip audio (STT)." },
      { status: 500 }
    );
  }
}
