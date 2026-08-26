import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/serverAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const admin = createAdminClient();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, email, role, is_active, paid_until, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate progress per user — small scale (5-10 users) so fetching all
  // session rows and reducing in JS is simpler and cheap enough vs a
  // separate grouped query per user.
  const { data: sessions } = await admin
    .from("practice_sessions")
    .select("user_id, section, created_at");

  const statsByUser = new Map<
    string,
    { total: number; reading: number; listening: number; speaking: number; lastActivity: string | null }
  >();

  for (const s of sessions ?? []) {
    const uid = s.user_id as string;
    const entry = statsByUser.get(uid) ?? {
      total: 0,
      reading: 0,
      listening: 0,
      speaking: 0,
      lastActivity: null,
    };
    entry.total++;
    if (s.section === "reading") entry.reading++;
    if (s.section === "listening") entry.listening++;
    if (s.section === "speaking") entry.speaking++;
    if (!entry.lastActivity || s.created_at > entry.lastActivity) {
      entry.lastActivity = s.created_at as string;
    }
    statsByUser.set(uid, entry);
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    progress: statsByUser.get(p.id) ?? {
      total: 0,
      reading: 0,
      listening: 0,
      speaking: 0,
      lastActivity: null,
    },
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { email, password, paidUntil } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Creates the auth.users row; the DB trigger auto-creates a matching profiles row
  // (role='user', is_active=false).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Gagal membuat user." },
      { status: 500 }
    );
  }

  // Admin is adding this user because payment is already verified — activate immediately.
  const { error: updateError } = await admin
    .from("profiles")
    .update({ is_active: true, paid_until: paidUntil || null })
    .eq("id", created.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: created.user.id });
}
