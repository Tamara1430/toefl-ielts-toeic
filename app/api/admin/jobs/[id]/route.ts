import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { getJob } from "@/lib/generationJobs";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const job = await getJob(id);
  if (!job) return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });

  return NextResponse.json({ job });
}
