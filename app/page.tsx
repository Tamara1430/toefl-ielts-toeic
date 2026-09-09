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

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
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
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-neutral-500">{greeting()} 👋</p>
            <h1 className="text-2xl font-bold text-neutral-900">Exam AI Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1.5">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-semibold text-orange-600">{streak}</span>
            </div>
            <Link
              href="/billing"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2"
            >
              Paket
            </Link>
            <LogoutButton className="text-xs text-neutral-400 hover:text-red-600 transition" />
          </div>
        </div>

        {isNewUser ? (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center mb-6">
            <Sparkles className="mx-auto text-indigo-500 mb-2" size={28} />
            <h2 className="font-semibold text-neutral-900 mb-1">Mulai perjalanan belajarmu!</h2>
            <p className="text-sm text-neutral-600 mb-4">
              Belum ada riwayat latihan. Yuk kerjakan sesi pertamamu untuk mulai naik level.
            </p>
            <Link
              href="/latihan"
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium transition"
            >
              Mulai Latihan <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Level / XP card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-700">Level {level}</span>
                <span className="text-xs text-neutral-400">
                  {xpIntoLevel} / {xpForNextLevel} XP
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${levelProgressPct}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">{history.length}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Total Sesi</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">
                  {avgScore !== null ? `${avgScore}%` : "—"}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">Rata-rata Skor</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">{todayCount}</p>
                <p className="text-xs text-neutral-400 mt-0.5">Sesi Hari Ini</p>
              </div>
            </div>
          </>
        )}

        {/* Continue practice */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-neutral-900">Lanjutkan Latihan</h2>
            <Link href="/latihan" className="text-xs text-indigo-600 font-medium">
              Lihat semua
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-5 px-5">
            {exams.map((exam) => (
              <Link
                key={exam}
                href={`/exam/${exam}`}
                className="shrink-0 w-40 rounded-xl border border-neutral-200 bg-white p-4 hover:border-indigo-400 hover:shadow-sm transition"
              >
                <p className="font-semibold text-neutral-900 text-sm">{EXAM_LABELS[exam]}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {history.filter((h) => h.exam === exam).length} sesi selesai
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium mt-3">
                  Mulai <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        {recent.length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold text-neutral-900 mb-3">Aktivitas Terbaru</h2>
            <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
              {recent.map((r) => {
                const s = scoreOf(r);
                return (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {EXAM_LABELS[r.exam]} · {SECTION_LABELS[r.section]}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(r.timestamp).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="font-semibold shrink-0">{s !== null ? `${s}%` : "—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-neutral-900">Pencapaian</h2>
            <span className="text-xs text-neutral-400">
              {unlockedBadges.length}/{badges.length} terbuka
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className={`rounded-xl border p-3 flex items-start gap-2.5 ${
                  b.achieved
                    ? "border-amber-200 bg-amber-50"
                    : "border-neutral-200 bg-white opacity-60"
                }`}
              >
                {b.achieved ? (
                  <Trophy size={18} className="text-amber-500 mt-0.5 shrink-0" />
                ) : (
                  <Lock size={18} className="text-neutral-300 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{b.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-snug">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
