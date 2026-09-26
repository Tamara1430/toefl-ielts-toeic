"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EXAM_LABELS, ExamType, SECTION_LABELS } from "@/lib/examConfig";
import { getAllHistory, MergedHistoryRecord } from "@/lib/history";
import {
  computeStreak,
  computeXP,
  computeLevel,
  computeBadges,
  averageScore,
  sessionsToday,
  scoreOf,
} from "@/lib/gamification";
import { Flame, Sparkles, ArrowRight, Lock, Trophy } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const exams: ExamType[] = ["toefl", "ielts", "toeic"];

// Each exam gets its own identity accent, used as a thin left border on
// its card — not decoration, it's how you tell the three apart at a
// glance in the horizontal scroller.
const examAccent: Record<ExamType, string> = {
  toefl: "var(--pine)",
  ielts: "var(--gold)",
  toeic: "var(--red)",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardHomePage() {
  const [history, setHistory] = useState<MergedHistoryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllHistory().then((h) => {
      setHistory(h);
      setLoaded(true);
    });
  }, []);

  const streak = computeStreak(history);
  const xp = computeXP(history);
  const { level, xpIntoLevel, xpForNextLevel } = computeLevel(xp);
  const badges = computeBadges(history);
  const unlockedBadges = badges.filter((b) => b.achieved);
  const avgScore = averageScore(history);
  const todayCount = sessionsToday(history);
  const levelProgressPct = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  const recent = history
    .slice()
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  if (!loaded) return null;

  const isNewUser = history.length === 0;

  // SVG ring geometry for the level indicator.
  const R = 30;
  const CIRC = 2 * Math.PI * R;
  const ringOffset = CIRC - (levelProgressPct / 100) * CIRC;

  return (
    <main className="min-h-screen bg-paper pb-28">
      {/* Header */}
      <div className="page-head header-glow flex items-start justify-between !pb-5">
        <div className="anim-fade-up">
          <p className="text-sm text-ink-soft">{greeting()} 👋</p>
          <h1 className="page-head__title">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 pt-1 anim-fade-up">
          <div className="flex items-center gap-1.5 rounded-full bg-gold-tint px-2.5 py-1">
            <Flame size={15} className="text-gold-ink" />
            <span className="stat-num text-sm text-gold-ink">{streak}</span>
          </div>
          <Link href="/billing" className="text-xs text-ink-soft hover:text-ink font-medium">
            Paket
          </Link>
          <LogoutButton className="text-xs text-ink-faint hover:text-red transition-colors" />
        </div>
      </div>

      <div className="container-page px-5 pt-6">
        {isNewUser ? (
          <div
            className="card p-6 text-center mb-6 anim-fade-up relative overflow-hidden"
            style={{ borderLeft: "3px solid var(--gold)" }}
          >
            <Sparkles className="mx-auto text-gold-ink mb-2 anim-float" size={26} />
            <h2 className="font-bold text-lg text-ink mb-1">Mulai perjalanan belajarmu</h2>
            <p className="text-sm text-ink-soft mb-5">
              Belum ada riwayat latihan. Kerjakan sesi pertamamu untuk mulai naik level.
            </p>
            <Link href="/latihan" className="btn btn-primary inline-flex anim-glow">
              Mulai latihan <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Level ring + quick stats, side by side */}
            <div className="flex gap-3 mb-8">
              <div className="card p-4 anim-scale-in flex items-center gap-4 flex-1">
                <div className="relative w-[72px] h-[72px] shrink-0">
                  <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
                    <circle cx="36" cy="36" r={R} fill="none" stroke="var(--rule)" strokeWidth="6" />
                    <circle
                      cx="36"
                      cy="36"
                      r={R}
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      style={{
                        ["--ring-circumference" as string]: CIRC,
                        ["--ring-offset" as string]: ringOffset,
                        animation: "ring-draw 0.9s cubic-bezier(0.16,1,0.3,1) both",
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="stat-num text-lg leading-none">{level}</span>
                    <span className="text-[9px] text-ink-faint mt-0.5">LVL</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">Level {level}</p>
                  <p className="stat-num text-xs text-ink-soft mt-0.5">
                    {xpIntoLevel} / {xpForNextLevel} XP
                  </p>
                  <p className="text-[11px] text-ink-faint mt-1">
                    {xpForNextLevel - xpIntoLevel} XP lagi naik level
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: "Total sesi", value: history.length },
                { label: "Rata-rata skor", value: avgScore !== null ? `${avgScore}%` : "—" },
                { label: "Sesi hari ini", value: todayCount },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="card lift p-3.5 text-center anim-fade-up stagger"
                  style={{ ["--d" as string]: `${i * 70}ms` }}
                >
                  <p className="stat-num text-xl">{s.value}</p>
                  <p className="text-xs text-ink-soft mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Continue practice */}
        <div className="mb-8 anim-fade-up stagger" style={{ ["--d" as string]: "80ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-ink">Lanjutkan latihan</h2>
            <Link href="/latihan" className="text-xs text-ink-soft hover:text-ink font-medium">
              Lihat semua
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5 snap-x snap-mandatory">
            {exams.map((exam, i) => (
              <Link
                key={exam}
                href={`/exam/${exam}`}
                className="card card-accent lift shrink-0 w-40 p-4 snap-start anim-fade-up stagger"
                style={{ ["--accent" as string]: examAccent[exam], ["--d" as string]: `${120 + i * 70}ms` }}
              >
                <p className="font-medium text-ink text-sm">{EXAM_LABELS[exam]}</p>
                <p className="text-xs text-ink-soft mt-1">
                  {history.filter((h) => h.exam === exam).length} sesi selesai
                </p>
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium mt-3"
                  style={{ color: examAccent[exam] }}
                >
                  Mulai <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity — timeline style */}
        {recent.length > 0 && (
          <div className="mb-8 anim-fade-up stagger" style={{ ["--d" as string]: "160ms" }}>
            <h2 className="font-bold text-base text-ink mb-3">Aktivitas terbaru</h2>
            <div className="card p-1">
              {recent.map((r, i) => {
                const s = scoreOf(r);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-3 py-3 text-sm ${
                      i !== recent.length - 1 ? "border-b border-rule" : ""
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: examAccent[r.exam] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink truncate">
                        {EXAM_LABELS[r.exam]} · {SECTION_LABELS[r.section]}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {new Date(r.timestamp).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="stat-num shrink-0">{s !== null ? `${s}%` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="anim-fade-up stagger" style={{ ["--d" as string]: "220ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-ink">Pencapaian</h2>
            <span className="stat-num text-xs text-ink-soft">
              {unlockedBadges.length}/{badges.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b, i) => (
              <div
                key={b.id}
                className={`card lift p-3 flex items-start gap-2.5 anim-fade-up stagger ${
                  b.achieved ? "" : "opacity-60"
                }`}
                style={{
                  ["--d" as string]: `${260 + i * 50}ms`,
                  ...(b.achieved ? { borderColor: "var(--gold)" } : {}),
                }}
              >
                {b.achieved ? (
                  <Trophy size={17} className="text-gold-ink mt-0.5 shrink-0 anim-pop" />
                ) : (
                  <Lock size={17} className="text-ink-faint mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink leading-tight">{b.label}</p>
                  <p className="text-xs text-ink-soft mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
