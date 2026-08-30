import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/ttsProvider";
import { GROQ_TTS_VOICE, EDGE_TTS_VOICE_POOL } from "@/lib/examConfig";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, voice, edgeVoice } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Field 'text' wajib diisi." }, { status: 400 });
    }

    const { buffer, contentType } = await synthesizeSpeech(
      text,
      voice || GROQ_TTS_VOICE,
      edgeVoice || EDGE_TTS_VOICE_POOL[0]
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
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
