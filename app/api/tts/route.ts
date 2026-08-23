import { NextRequest, NextResponse } from "next/server";
import { getGroqClient } from "@/lib/groqClient";
import { GROQ_TTS_MODEL, GROQ_TTS_VOICE } from "@/lib/examConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Field 'text' wajib diisi." }, { status: 400 });
    }

    const groq = getGroqClient();

    const response = await groq.audio.speech.create({
      model: GROQ_TTS_MODEL,
      voice: voice || GROQ_TTS_VOICE,
      input: text,
      response_format: "wav",
    });

    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("tts error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Gagal membuat audio (TTS)." },
      { status: 500 }
    );
  }
}
