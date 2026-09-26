"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ExamType, EXAM_LABELS } from "@/lib/examConfig";
import { getEntitlement, Entitlements, EntitlementLevel } from "@/lib/entitlements";
import LogoutButton from "@/components/LogoutButton";
import {
  Mail,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Crown,
  Package,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

const EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];

interface ProfileRow {
  email: string;
  role: string;
  is_active: boolean;
  paid_until: string | null;
  entitlements: Entitlements;
  created_at: string;
}

const LEVEL_BADGE: Record<EntitlementLevel, { label: string; className: string }> = {
  free: { label: "Free", className: "tag" },
  ujian: { label: "Ujian", className: "tag tag-pine" },
  premium: { label: "Premium", className: "tag tag-gold" },
};

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [showPw, setShowPw] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("email, role, is_active, paid_until, entitlements, created_at")
        .eq("id", user.id)
        .single();
      setProfile((data as ProfileRow) ?? null);
      setLoading(false);
    }
    load();
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (newPassword.length < 6) {
      setPwError("Password minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Konfirmasi password tidak cocok.");
      return;
    }

    setPwSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);

    if (error) {
      setPwError(error.message);
      return;
    }

    setPwSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  const isUltimate =
    profile &&
    EXAMS.every((exam) => getEntitlement(profile.entitlements, exam) === "premium");

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-ink-faint" size={22} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-5">
        <p className="text-ink-soft text-sm">Belum login.</p>
      </main>
    );
  }

  const initial = profile.email.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head header-glow flex items-start justify-between !pb-6">
        <div className="flex items-center gap-3 anim-fade-up">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 anim-pop"
            style={{ background: "var(--indigo-tint)", color: "var(--indigo)" }}
          >
            {initial}
          </div>
          <div>
            <p className="text-sm text-ink-soft">Akun</p>
            <h1 className="page-head__title !text-xl">Profil</h1>
          </div>
        </div>
        <LogoutButton className="text-xs text-ink-faint hover:text-red transition-colors anim-fade-up" />
      </div>

      <div className="container-page px-5 pt-2">
        {/* Account info */}
        <div className="card p-5 mb-4 anim-fade-up stagger" style={{ ["--d" as string]: "0ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <Mail size={17} className="text-ink-soft shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">Email</p>
              <p className="text-sm font-medium text-ink truncate">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            {profile.is_active ? (
              <ShieldCheck size={17} className="text-pine shrink-0" />
            ) : (
              <ShieldAlert size={17} className="text-gold-ink shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs text-ink-faint">Status akun</p>
              <p className="text-sm font-medium text-ink flex items-center gap-1.5">
                {profile.is_active ? "Aktif" : "Belum aktif"}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? "anim-glow" : ""}`}
                  style={{ background: profile.is_active ? "var(--pine)" : "var(--gold)" }}
                />
              </p>
            </div>
          </div>

          {profile.paid_until && (
            <div className="flex items-center gap-3">
              <CalendarDays size={17} className="text-ink-soft shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-ink-faint">Berlaku sampai</p>
                <p className="text-sm font-medium text-ink">
                  {new Date(profile.paid_until).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Current package */}
        <div className="card p-5 mb-4 anim-fade-up stagger" style={{ ["--d" as string]: "80ms" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-ink-soft" />
              <h2 className="font-bold text-base text-ink">Paket kamu</h2>
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1 text-xs text-ink font-medium underline underline-offset-2"
            >
              Upgrade <ArrowRight size={12} />
            </Link>
          </div>

          {isUltimate && (
            <div
              className="flex items-center gap-2 rounded-[7px] px-3 py-2 mb-3 border anim-glow"
              style={{ background: "var(--gold-tint)", borderColor: "var(--gold)" }}
            >
              <Crown size={16} className="text-gold-ink" />
              <span className="text-sm font-semibold text-gold-ink">Ultimate — akses penuh</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {EXAMS.map((exam, i) => {
              const level = getEntitlement(profile.entitlements, exam);
              const badge = LEVEL_BADGE[level];
              return (
                <div
                  key={exam}
                  className="flex items-center justify-between rounded-[7px] border border-rule px-3 py-2.5 lift anim-fade-up stagger"
                  style={{ ["--d" as string]: `${120 + i * 50}ms` }}
                >
                  <span className="text-sm font-medium text-ink">{EXAM_LABELS[exam]}</span>
                  <span className={badge.className}>{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change password */}
        <div className="card p-5 anim-fade-up stagger" style={{ ["--d" as string]: "160ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-ink-soft" />
            <h2 className="font-bold text-base text-ink">Ganti password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru"
                autoComplete="new-password"
                className="field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <input
              type={showPw ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password baru"
              autoComplete="new-password"
              className="field"
            />

            {pwError && (
              <div className="flex items-center gap-1.5 text-xs text-red-ink">
                <AlertCircle size={14} /> {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-pine">
                <CheckCircle2 size={14} /> Password berhasil diganti.
              </div>
            )}

            <button
              type="submit"
              disabled={pwSaving || !newPassword || !confirmPassword}
              className="btn btn-primary w-fit"
            >
              {pwSaving && <Loader2 size={14} className="animate-spin" />}
              Simpan password baru
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
