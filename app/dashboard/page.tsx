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

  return (
    <main className="min-h-screen bg-paper pb-28">
      {/* Header */}
      <div className="page-head flex items-start justify-between !pb-4">
        <div>
          <p className="text-sm text-ink-soft">{greeting()}</p>
          <h1 className="page-head__title">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-gold-ink" />
            <span className="stat-num text-sm">{streak}</span>
          </div>
          <Link href="/billing" className="text-xs text-ink-soft hover:text-ink font-medium">
            Paket
          </Link>
          <LogoutButton className="text-xs text-ink-faint hover:text-red transition-colors" />
        </div>
      </div>

      <div className="container-page px-5 pt-6">
        {isNewUser ? (
          <div className="card p-6 text-center mb-6" style={{ borderLeft: "3px solid var(--gold)" }}>
            <Sparkles className="mx-auto text-gold-ink mb-2" size={24} />
            <h2 className="font-serif text-lg text-ink mb-1">Mulai perjalanan belajarmu</h2>
            <p className="text-sm text-ink-soft mb-5">
              Belum ada riwayat latihan. Kerjakan sesi pertamamu untuk mulai naik level.
            </p>
            <Link href="/latihan" className="btn btn-primary inline-flex">
              Mulai latihan <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Level / XP card */}
            <div className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-ink">Level {level}</span>
                <span className="stat-num text-xs text-ink-soft">
                  {xpIntoLevel} / {xpForNextLevel} XP
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--rule)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${levelProgressPct}%`, background: "var(--gold)" }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="card p-3.5 text-center">
                <p className="stat-num text-xl">{history.length}</p>
                <p className="text-xs text-ink-soft mt-1">Total sesi</p>
              </div>
              <div className="card p-3.5 text-center">
                <p className="stat-num text-xl">{avgScore !== null ? `${avgScore}%` : "—"}</p>
                <p className="text-xs text-ink-soft mt-1">Rata-rata skor</p>
              </div>
              <div className="card p-3.5 text-center">
                <p className="stat-num text-xl">{todayCount}</p>
                <p className="text-xs text-ink-soft mt-1">Sesi hari ini</p>
              </div>
            </div>
          </>
        )}

        {/* Continue practice */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base text-ink">Lanjutkan latihan</h2>
            <Link href="/latihan" className="text-xs text-ink-soft hover:text-ink font-medium">
              Lihat semua
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
            {exams.map((exam) => (
              <Link
                key={exam}
                href={`/exam/${exam}`}
                className="card shrink-0 w-40 p-4 hover:border-rule-strong transition-colors"
                style={{ borderLeft: `3px solid ${examAccent[exam]}` }}
              >
                <p className="font-medium text-ink text-sm">{EXAM_LABELS[exam]}</p>
                <p className="text-xs text-ink-soft mt-1">
                  {history.filter((h) => h.exam === exam).length} sesi selesai
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-ink font-medium mt-3">
                  Mulai <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-base text-ink mb-3">Aktivitas terbaru</h2>
            <div className="card divide-y divide-[var(--rule)]">
              {recent.map((r) => {
                const s = scoreOf(r);
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="min-w-0">
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-base text-ink">Pencapaian</h2>
            <span className="stat-num text-xs text-ink-soft">
              {unlockedBadges.length}/{badges.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`card p-3 flex items-start gap-2.5 ${b.achieved ? "" : "opacity-60"}`}
                style={b.achieved ? { borderColor: "var(--gold)" } : undefined}
              >
                {b.achieved ? (
                  <Trophy size={17} className="text-gold-ink mt-0.5 shrink-0" />
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
