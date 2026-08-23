import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALL_EXAMS, ALL_SECTIONS, ALL_DIFFICULTIES, MIN_POOL_SIZE } from "@/lib/questionGeneration";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const stock: { exam: string; section: string; difficulty: string; count: number }[] = [];

  for (const exam of ALL_EXAMS) {
    for (const section of ALL_SECTIONS) {
      for (const difficulty of ALL_DIFFICULTIES) {
        const { count } = await admin
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("exam", exam)
          .eq("section", section)
          .eq("difficulty", difficulty);
        stock.push({ exam, section, difficulty, count: count ?? 0 });
      }
    }
  }

  return NextResponse.json({ stock, minPoolSize: MIN_POOL_SIZE });
}
