"use client";

import { useEffect, useState } from "react";
import { ExamType, SectionType, Difficulty } from "@/lib/examConfig";
import { Loader2, Volume2, VolumeX, Sparkles } from "lucide-react";

interface QuestionRow {
  id: string;
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  payload: any;
  created_at: string;
}

interface Props {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  activeQuestionId?: string | null;
}

export default function AdminQuestionList({ exam, section, difficulty, activeQuestionId }: Props) {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/questions?exam=${exam}&section=${section}&difficulty=${difficulty}`)
      .then((res) => res.json())
      .then((json) => setQuestions(json.questions ?? []))
      .finally(() => setLoading(false));
  }, [exam, section, difficulty]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-400 py-4 px-1">
        <Loader2 size={14} className="animate-spin" /> Memuat soal...
      </div>
    );
  }

  if (questions.length === 0) {
    return <p className="text-sm text-neutral-400 py-4 px-1">Belum ada soal untuk kombinasi ini.</p>;
  }

  return (
    <div className="flex flex-col divide-y divide-neutral-100 px-1">
      {questions.map((q) => {
        const isActive = activeQuestionId === q.id;
        const title = q.payload?.title ?? "(tanpa judul)";
        const turns = q.section === "listening" ? q.payload?.turns : null;
        const withAudio = Array.isArray(turns) ? turns.filter((t: any) => t.audioUrl).length : null;
        const totalTurns = Array.isArray(turns) ? turns.length : null;
        const audioComplete = withAudio !== null && withAudio === totalTurns;

        return (
          <div
            key={q.id}
            className={`py-2.5 flex items-center justify-between gap-3 text-sm transition ${
              isActive ? "bg-indigo-50 -mx-1 px-1 rounded-lg" : ""
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium truncate flex items-center gap-1.5">
                {title}
                {isActive && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-normal shrink-0">
                    <Sparkles size={11} className="animate-pulse" /> sedang diproses
                  </span>
                )}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(q.created_at).toLocaleString("id-ID")}
              </p>
            </div>
            {totalTurns !== null && (
              <span
                className={`inline-flex items-center gap-1 text-xs shrink-0 px-2 py-1 rounded-full ${
                  audioComplete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {audioComplete ? <Volume2 size={12} /> : <VolumeX size={12} />}
                {withAudio}/{totalTurns} audio
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
