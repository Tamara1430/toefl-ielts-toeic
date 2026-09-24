import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groq_rate_limits")
    .select("*")
    .order("model", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
