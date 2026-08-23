"use client";

import { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import { Difficulty, ExamType } from "@/lib/examConfig";
import { recordSession } from "@/lib/history";
import { Loader2 } from "lucide-react";

export interface SpeakingTask {
  title: string;
  prompt: string;
  stimulus: string;
  prepSeconds: number;
  responseSeconds: number;
  scoringTips: string[];
}

interface Feedback {
  score: number;
  scoreScaleNote: string;
  strengths: string[];
  improvements: string[];
  correctedSample: string;
}

export default function SpeakingSession({
  exam,
  difficulty,
  task,
  questionId,
}: {
  exam: ExamType;
  difficulty: Difficulty;
  task: SpeakingTask;
  questionId?: string | null;
}) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getFeedback(text: string) {
    setLoadingFeedback(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          prompt: task.prompt,
          transcript: text,
          scoringTips: task.scoringTips,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menilai jawaban.");
      const data = json.data as Feedback;
      setFeedback(data);
      recordSession({
        exam,
        section: "speaking",
        difficulty,
        questionId: questionId ?? undefined,
        title: task.title,
        speakingScore: data.score,
        speakingScale: data.scoreScaleNote,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingFeedback(false);
    }
  }

  function handleTranscript(text: string) {
    setTranscript(text);
    getFeedback(text);
  }

  return (
    <div className="flex flex-col gap-5 mt-4">
      <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50">
        <p className="whitespace-pre-wrap">{task.prompt}</p>
        {task.stimulus && (
          <div className="mt-3 rounded-lg bg-white border border-neutral-200 p-3 text-sm text-neutral-700 whitespace-pre-wrap">
            {task.stimulus}
          </div>
        )}
        <div className="flex gap-4 text-xs text-neutral-500 mt-3">
          <span>Persiapan: {task.prepSeconds}s</span>
          <span>Waktu jawab: {task.responseSeconds}s</span>
        </div>
      </div>

      <AudioRecorder onTranscript={handleTranscript} disabled={loadingFeedback} />

      {transcript && (
        <div className="rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-500 mb-1">Transkrip jawabanmu:</p>
          <p className="italic">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {loadingFeedback && (
        <p className="flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 size={16} className="animate-spin" /> AI sedang menilai jawabanmu...
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {feedback && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700">{feedback.score}%</span>
            <span className="text-sm text-neutral-600">{feedback.scoreScaleNote}</span>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Kelebihan</p>
            <ul className="list-disc list-inside text-sm text-neutral-700">
              {feedback.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Yang perlu diperbaiki</p>
            <ul className="list-disc list-inside text-sm text-neutral-700">
              {feedback.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Contoh jawaban yang lebih baik</p>
            <p className="text-sm text-neutral-700 italic">{feedback.correctedSample}</p>
          </div>
        </div>
      )}
    </div>
  );
}

