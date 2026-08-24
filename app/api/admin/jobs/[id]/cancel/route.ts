import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { cancelJob } from "@/lib/generationJobs";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    await cancelJob(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Gagal membatalkan job." }, { status: 500 });
  }
}
