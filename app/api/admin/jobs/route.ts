import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createJob, JobKind } from "@/lib/generationJobs";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { kind } = (await req.json()) as { kind: JobKind };
  if (kind !== "questions" && kind !== "voices") {
    return NextResponse.json({ error: "kind tidak valid." }, { status: 400 });
  }

  try {
    const jobId = await createJob(kind);
    return NextResponse.json({ jobId });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Gagal membuat job." }, { status: 500 });
  }
}
