import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const exam = searchParams.get("exam");
  const section = searchParams.get("section");
  const difficulty = searchParams.get("difficulty");

  const admin = createAdminClient();
  let query = admin
    .from("questions")
    .select("id, exam, section, difficulty, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (exam) query = query.eq("exam", exam);
  if (section) query = query.eq("section", section);
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ questions: data });
}
