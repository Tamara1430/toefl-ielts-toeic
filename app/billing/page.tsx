"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PACKAGES, getEntitlement, Entitlements, EntitlementLevel } from "@/lib/entitlements";
import { EXAM_LABELS, ExamType } from "@/lib/examConfig";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";

const EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];

// GANTI dengan nomor WhatsApp bisnis kamu sendiri sebelum deploy ke production!
// Format: kode negara tanpa "+" atau "0" di depan, contoh Indonesia: 62812xxxxxxx
const WHATSAPP_NUMBER = "6285778435598";

function waLink(packageName: string) {
  const text = encodeURIComponent(`Halo, saya tertarik paket ${packageName}.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

const LEVEL_BADGE: Record<EntitlementLevel, { label: string; className: string }> = {
  free: { label: "Free", className: "tag" },
  ujian: { label: "Ujian", className: "tag tag-pine" },
  premium: { label: "Premium", className: "tag tag-gold" },
};

interface ProfileRow {
  entitlements: Entitlements;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [entitlements, setEntitlements] = useState<Entitlements>({});

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
      setLoggedIn(true);
      const { data } = await supabase
        .from("profiles")
        .select("entitlements")
        .eq("id", user.id)
        .single();
      setEntitlements((data as ProfileRow | null)?.entitlements ?? {});
      setLoading(false);
    }
    load();
  }, []);

  const isUltimate = EXAMS.every((exam) => getEntitlement(entitlements, exam) === "premium");
  const isAllFree = EXAMS.every((exam) => getEntitlement(entitlements, exam) === "free");

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head header-glow !pb-5">
        <div className="anim-fade-up">
          <h1 className="page-head__title">Paket &amp; harga</h1>
          <p className="page-head__desc">
            Latihan selalu gratis dengan kuota terbatas. Upgrade untuk latihan tanpa batas, akses
            Ujian, dan sertifikat hasil skor.
          </p>
        </div>
      </div>

      <div className="container-page px-5 pt-2">
        {/* Current package — reflects the same entitlements shown on Profil */}
        <div className="card p-5 mb-4 anim-fade-up">
          <p className="text-xs font-medium text-ink-faint mb-2">Paket saat ini</p>

          {loading ? (
            <div className="flex items-center gap-2 py-2 text-ink-faint">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Memuat...</span>
            </div>
          ) : !loggedIn ? (
            <>
              <h2 className="font-bold text-lg text-ink mb-2">Free</h2>
              <p className="text-xs text-ink-faint mb-3">Login untuk melihat paket akunmu.</p>
              <ul className="text-sm text-ink-soft flex flex-col gap-1.5">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-ink-faint shrink-0" /> 10 soal Reading per exam
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-ink-faint shrink-0" /> 10 soal Listening per exam
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-ink-faint shrink-0" /> 3 soal Speaking per exam
                </li>
              </ul>
            </>
          ) : isUltimate ? (
            <div
              className="flex items-center gap-2 rounded-[7px] px-3 py-2.5"
              style={{ background: "var(--gold-tint)", border: "1px solid var(--gold)" }}
            >
              <Crown size={17} className="text-gold-ink shrink-0" />
              <span className="text-sm font-semibold text-gold-ink">Ultimate — akses penuh</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {EXAMS.map((exam) => {
                const level = getEntitlement(entitlements, exam);
                const badge = LEVEL_BADGE[level];
                return (
                  <div
                    key={exam}
                    className="flex items-center justify-between rounded-[7px] border border-rule px-3 py-2.5"
                  >
                    <span className="text-sm font-medium text-ink">{EXAM_LABELS[exam]}</span>
                    <span className={badge.className}>{badge.label}</span>
                  </div>
                );
              })}
              {isAllFree && (
                <p className="text-xs text-ink-faint mt-1">
                  Kuota gratis: 10 Reading, 10 Listening, 3 Speaking per exam.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {PACKAGES.map((pkg, i) => (
            <div
              key={pkg.id}
              className="card lift p-5 relative anim-fade-up stagger"
              style={{
                ["--d" as string]: `${i * 60}ms`,
                ...(pkg.recommended ? { borderColor: "var(--gold)", borderWidth: 2 } : {}),
              }}
            >
              {pkg.recommended && (
                <span
                  className="absolute -top-3 left-5 inline-flex items-center gap-1 text-surface text-xs font-medium px-3 py-1 rounded-[5px]"
                  style={{ background: "var(--gold-ink)" }}
                >
                  <Sparkles size={12} /> Paling direkomendasikan
                </span>
              )}
              <h2 className="font-bold text-lg text-ink">{pkg.name}</h2>
              <div className="flex items-baseline gap-2 mt-1 mb-3">
                {pkg.originalPriceLabel && (
                  <span className="text-sm text-ink-faint line-through">
                    {pkg.originalPriceLabel}
                  </span>
                )}
                <span className="stat-num text-xl">{pkg.priceLabel}</span>
              </div>
              <ul className="text-sm text-ink-soft flex flex-col gap-1.5 mb-4">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-pine shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink(pkg.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn w-full sm:w-auto ${pkg.recommended ? "" : "btn-primary"}`}
                style={pkg.recommended ? { background: "var(--gold-ink)", color: "var(--surface)" } : undefined}
              >
                Hubungi via WhatsApp
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-8">
          Pembayaran diverifikasi manual oleh admin. Setelah kamu chat &amp; transfer, akunmu akan
          diaktifkan sesuai paket dalam waktu singkat.
        </p>
      </div>
    </main>
  );
}
