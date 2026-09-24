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
  free: { label: "Free", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
  ujian: { label: "Ujian", className: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  premium: { label: "Premium", className: "bg-emerald-50 text-emerald-600 border-emerald-200" },
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
      <main className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-neutral-400" size={24} />
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-5">
        <p className="text-neutral-500 text-sm">Belum login.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-neutral-500">Akun</p>
            <h1 className="text-2xl font-bold text-neutral-900">Profil</h1>
          </div>
          <LogoutButton className="text-xs text-neutral-400 hover:text-red-600 transition" />
        </div>

        {/* Account info */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Mail size={16} className="text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Email</p>
              <p className="text-sm font-medium text-neutral-900 truncate">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                profile.is_active ? "bg-emerald-50" : "bg-amber-50"
              }`}
            >
              {profile.is_active ? (
                <ShieldCheck size={16} className="text-emerald-600" />
              ) : (
                <ShieldAlert size={16} className="text-amber-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-400">Status akun</p>
              <p className="text-sm font-medium text-neutral-900">
                {profile.is_active ? "Aktif" : "Belum aktif"}
              </p>
            </div>
          </div>

          {profile.paid_until && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-neutral-50 flex items-center justify-center shrink-0">
                <CalendarDays size={16} className="text-neutral-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-400">Berlaku sampai</p>
                <p className="text-sm font-medium text-neutral-900">
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-neutral-500" />
              <h2 className="font-semibold text-neutral-900">Paket Kamu</h2>
            </div>
            <Link
              href="/billing"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800"
            >
              Upgrade <ArrowRight size={12} />
            </Link>
          </div>

          {isUltimate && (
            <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-200 px-3 py-2 mb-3">
              <Crown size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">Ultimate — akses penuh</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {EXAMS.map((exam) => {
              const level = getEntitlement(profile.entitlements, exam);
              const badge = LEVEL_BADGE[level];
              return (
                <div
                  key={exam}
                  className="flex items-center justify-between rounded-xl border border-neutral-100 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-neutral-800">{EXAM_LABELS[exam]}</span>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-neutral-500" />
            <h2 className="font-semibold text-neutral-900">Ganti Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Password baru"
                autoComplete="new-password"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            {pwError && (
              <div className="flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={14} /> {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 size={14} /> Password berhasil diganti.
              </div>
            )}

            <button
              type="submit"
              disabled={pwSaving || !newPassword || !confirmPassword}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium transition"
            >
              {pwSaving && <Loader2 size={14} className="animate-spin" />}
              Simpan Password Baru
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
