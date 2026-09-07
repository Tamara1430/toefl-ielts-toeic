"use client";

import { useEffect, useState } from "react";
import { ExamType, SectionType, Difficulty } from "@/lib/examConfig";
import { Loader2, Volume2, VolumeX, Sparkles, Wand2, UserCheck, UserX } from "lucide-react";

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
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [fixingGenderIds, setFixingGenderIds] = useState<Set<string>>(new Set());
  const [rowErrors, setRowErrors] = useState<Record<string, string[]>>({});
  const [genderRowErrors, setGenderRowErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/questions?exam=${exam}&section=${section}&difficulty=${difficulty}`)
      .then((res) => res.json())
      .then((json) => setQuestions(json.questions ?? []))
      .finally(() => setLoading(false));
  }, [exam, section, difficulty]);

  async function handleGenerateOne(questionId: string) {
    setGeneratingIds((prev) => new Set(prev).add(questionId));
    setRowErrors((prev) => ({ ...prev, [questionId]: [] }));
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/generate-voice`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate audio.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, payload: json.payload } : q))
      );
      if (json.errors?.length) {
        setRowErrors((prev) => ({ ...prev, [questionId]: json.errors }));
      }
    } catch (e: any) {
      setRowErrors((prev) => ({ ...prev, [questionId]: [e.message] }));
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

  async function handleFixGenderOne(questionId: string) {
    setFixingGenderIds((prev) => new Set(prev).add(questionId));
    setGenderRowErrors((prev) => ({ ...prev, [questionId]: [] }));
    try {
      const res = await fetch(`/api/admin/questions/${questionId}/fix-gender`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal perbaiki gender.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? { ...q, payload: json.payload } : q))
      );
      if (json.errors?.length) {
        setGenderRowErrors((prev) => ({ ...prev, [questionId]: json.errors }));
      }
    } catch (e: any) {
      setGenderRowErrors((prev) => ({ ...prev, [questionId]: [e.message] }));
    } finally {
      setFixingGenderIds((prev) => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }

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
        const isActiveFromBulk = activeQuestionId === q.id;
        const isGeneratingThis = generatingIds.has(q.id);
        const isFixingGenderThis = fixingGenderIds.has(q.id);
        const title = q.payload?.title ?? "(tanpa judul)";
        const turns = q.section === "listening" ? q.payload?.turns : null;
        const withAudio = Array.isArray(turns) ? turns.filter((t: any) => t.audioUrl).length : null;
        const totalTurns = Array.isArray(turns) ? turns.length : null;
        const audioComplete = withAudio !== null && withAudio === totalTurns;
        const errors = rowErrors[q.id] ?? [];
        const genderErrors = genderRowErrors[q.id] ?? [];
        const usedEdge = Array.isArray(turns) && turns.some((t: any) => t.ttsProvider === "edge");
        const genderComplete = Array.isArray(turns) ? turns.every((t: any) => t.gender) : true;

        return (
          <div
            key={q.id}
            className={`py-2.5 flex items-center justify-between gap-3 text-sm transition flex-wrap ${
              isActiveFromBulk || isGeneratingThis || isFixingGenderThis
                ? "bg-indigo-50 -mx-1 px-1 rounded-lg"
                : ""
            }`}
          >
            <div className="min-w-0">
              <p className="font-medium truncate flex items-center gap-1.5">
                {title}
                {(isActiveFromBulk || isGeneratingThis || isFixingGenderThis) && (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-normal shrink-0">
                    <Sparkles size={11} className="animate-pulse" /> sedang diproses
                  </span>
                )}
                {usedEdge && (
                  <span className="text-xs text-neutral-400 shrink-0">(sebagian via Edge TTS)</span>
                )}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(q.created_at).toLocaleString("id-ID")}
              </p>
              {errors.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.length} giliran audio gagal — coba klik Generate lagi.
                </p>
              )}
              {genderErrors.length > 0 && (
                <p className="text-xs text-red-600 mt-1">{genderErrors[0]}</p>
              )}
            </div>

            {totalTurns !== null && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    genderComplete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {genderComplete ? <UserCheck size={12} /> : <UserX size={12} />}
                  {genderComplete ? "Gender OK" : "Gender belum"}
                </span>
                {!genderComplete && (
                  <button
                    onClick={() => handleFixGenderOne(q.id)}
                    disabled={isFixingGenderThis}
                    className="flex items-center gap-1 text-xs rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 px-2.5 py-1 font-medium transition"
                  >
                    {isFixingGenderThis ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Wand2 size={11} />
                    )}
                    {isFixingGenderThis ? "Proses..." : "Perbaiki"}
                  </button>
                )}

                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    audioComplete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {audioComplete ? <Volume2 size={12} /> : <VolumeX size={12} />}
                  {withAudio}/{totalTurns} audio
                </span>
                {!audioComplete && (
                  <button
                    onClick={() => handleGenerateOne(q.id)}
                    disabled={isGeneratingThis}
                    className="flex items-center gap-1 text-xs rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 px-2.5 py-1 font-medium transition"
                  >
                    {isGeneratingThis ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Wand2 size={11} />
                    )}
                    {isGeneratingThis ? "Proses..." : "Generate"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
