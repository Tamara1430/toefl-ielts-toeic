import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAndCacheListeningAudio } from "@/lib/audioGeneration";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: question, error: fetchError } = await admin
    .from("questions")
    .select("id, section, payload")
    .eq("id", id)
    .single();

  if (fetchError || !question) {
    return NextResponse.json({ error: "Soal tidak ditemukan." }, { status: 404 });
  }
  if (question.section !== "listening") {
    return NextResponse.json({ error: "Soal ini bukan tipe listening." }, { status: 400 });
  }

  try {
    const result = await generateAndCacheListeningAudio(id, question.payload as any);

    const { data: updated } = await admin
      .from("questions")
      .select("payload")
      .eq("id", id)
      .single();

    return NextResponse.json({ payload: updated?.payload ?? question.payload, errors: result.errors });
  } catch (err: any) {
    console.error("generate single voice error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal generate audio." }, { status: 500 });
  }
}
