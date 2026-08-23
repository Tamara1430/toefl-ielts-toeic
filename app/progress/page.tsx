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
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Progress Belajar</h1>
        <p className="text-neutral-500 text-sm mb-5">
          Pantau perkembangan skormu di setiap exam dari waktu ke waktu.
        </p>

        {loaded && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
              <p className="text-xl font-bold text-neutral-900">{allHistory.length}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Total Sesi</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
              <p className="text-xl font-bold text-neutral-900">{avg !== null ? `${avg}%` : "—"}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Rata-rata Skor</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center flex flex-col items-center justify-center">
              <p className="text-xl font-bold text-neutral-900 flex items-center gap-1">
                <Flame size={16} className="text-orange-500" /> {streak}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">Hari Beruntun</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-5">
          {exams.map((e) => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                exam === e
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
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
