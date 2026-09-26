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

  const activeIdx = exams.indexOf(exam);

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head header-glow !pb-5">
        <div className="anim-fade-up">
          <h1 className="page-head__title">Progress belajar</h1>
          <p className="page-head__desc">
            Pantau perkembangan skormu di setiap exam dari waktu ke waktu.
          </p>
        </div>
      </div>

      <div className="container-page px-5 pt-2">
        {loaded && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Total sesi", value: allHistory.length },
              { label: "Rata-rata skor", value: avg !== null ? `${avg}%` : "—" },
              {
                label: "Hari beruntun",
                value: (
                  <span className="flex items-center gap-1">
                    <Flame size={16} className="text-gold-ink" /> {streak}
                  </span>
                ),
              },
            ].map((s, i) => (
              <div
                key={s.label}
                className="card lift p-3.5 text-center flex flex-col items-center justify-center anim-fade-up stagger"
                style={{ ["--d" as string]: `${i * 70}ms` }}
              >
                <p className="stat-num text-xl">{s.value}</p>
                <p className="text-xs text-ink-soft mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="pill-tabs mb-5 anim-fade-up stagger" style={{ ["--d" as string]: "180ms" }}>
          <span
            className="pill-tab-indicator"
            style={{
              width: `${100 / exams.length}%`,
              transform: `translateX(${activeIdx * 100}%)`,
            }}
          />
          {exams.map((e) => (
            <button
              key={e}
              onClick={() => setExam(e)}
              data-active={exam === e}
              className="pill-tab flex-1"
            >
              <span>{EXAM_LABELS[e]}</span>
            </button>
          ))}
        </div>

        <div key={exam} className="anim-fade-up">
          <SessionHistory exam={exam} />
        </div>
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
