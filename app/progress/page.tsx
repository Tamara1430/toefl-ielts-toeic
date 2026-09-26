"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EXAM_LABELS, ExamType } from "@/lib/examConfig";
import { getAllHistory, MergedHistoryRecord } from "@/lib/history";
import { computeStreak, averageScore } from "@/lib/gamification";
import SessionHistory from "@/components/SessionHistory";
import { Flame } from "lucide-react";

const exams: ExamType[] = ["toefl", "ielts", "toeic"];

function ProgressContent() {
  const searchParams = useSearchParams();
  const preselect = searchParams.get("exam") as ExamType | null;

  const [exam, setExam] = useState<ExamType>(
    preselect && exams.includes(preselect) ? preselect : "toefl"
  );
  const [allHistory, setAllHistory] = useState<MergedHistoryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getAllHistory().then((h) => {
      setAllHistory(h);
      setLoaded(true);
    });
  }, []);

  const streak = computeStreak(allHistory);
  const avg = averageScore(allHistory);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head !pb-4">
        <h1 className="page-head__title">Progress belajar</h1>
        <p className="page-head__desc">
          Pantau perkembangan skormu di setiap exam dari waktu ke waktu.
        </p>
      </div>

      <div className="container-page px-5 pt-6">
        {loaded && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-3.5 text-center">
              <p className="stat-num text-xl">{allHistory.length}</p>
              <p className="text-xs text-ink-soft mt-1">Total sesi</p>
            </div>
            <div className="card p-3.5 text-center">
              <p className="stat-num text-xl">{avg !== null ? `${avg}%` : "—"}</p>
              <p className="text-xs text-ink-soft mt-1">Rata-rata skor</p>
            </div>
            <div className="card p-3.5 text-center flex flex-col items-center justify-center">
              <p className="stat-num text-xl flex items-center gap-1">
                <Flame size={16} className="text-gold-ink" /> {streak}
              </p>
              <p className="text-xs text-ink-soft mt-1">Hari beruntun</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          {exams.map((e) => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className={`px-4 py-2 rounded-[7px] text-sm font-medium transition-colors border ${
                exam === e
                  ? "bg-ink text-surface border-ink"
                  : "bg-surface text-ink-soft border-rule-strong hover:border-ink"
              }`}
            >
              {EXAM_LABELS[e]}
            </button>
          ))}
        </div>

        <SessionHistory exam={exam} />
      </div>
    </main>
  );
}

export default function ProgressPage() {
  return (
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  );
}
