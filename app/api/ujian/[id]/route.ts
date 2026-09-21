import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Hasil ujian tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ attempt: data });
}
