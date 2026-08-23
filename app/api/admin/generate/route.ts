import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { topUpAllPools } from "@/lib/questionGeneration";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const results = await topUpAllPools();
    const totalGenerated = results.reduce((sum, r) => sum + r.generated, 0);
    return NextResponse.json({ totalGenerated, results });
  } catch (err: any) {
    console.error("admin generate error:", err);
    return NextResponse.json({ error: err?.message ?? "Gagal generate." }, { status: 500 });
  }
}
