import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { topUpOne } from "@/lib/questionGeneration";
import { ExamType, SectionType, Difficulty } from "@/lib/examConfig";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { exam, section, difficulty, count } = (await req.json()) as {
    exam: ExamType;
    section: SectionType;
    difficulty: Difficulty;
    count: number;
  };

  if (!exam || !section || !difficulty || !count || count < 1) {
    return NextResponse.json({ error: "Field tidak lengkap atau count tidak valid." }, { status: 400 });
  }

  try {
    const result = await topUpOne(exam, section, difficulty, Math.min(count, 20));
    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("generate-specific error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal generate." }, { status: 500 });
  }
}
