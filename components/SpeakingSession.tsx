"use client";

import { useState } from "react";
import AudioRecorder from "./AudioRecorder";
import { Difficulty, ExamType } from "@/lib/examConfig";
import { recordSession } from "@/lib/history";
import { Loader2, Mic, ShieldAlert } from "lucide-react";

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
  skipHistory,
  onScored,
}: {
  exam: ExamType;
  difficulty: Difficulty;
  task: SpeakingTask;
  questionId?: string | null;
  /** Skip logging to practice_sessions — used by Ujian mode, which records
   * its own exam_attempts row instead via a separate endpoint. */
  skipHistory?: boolean;
  /** Called with the 0-100 score once feedback comes back — used by Ujian
   * mode to collect scores across multiple speaking tasks in one session. */
  onScored?: (score: number) => void;
}) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readyToRecord, setReadyToRecord] = useState(false);

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
      if (!skipHistory) {
        recordSession({
          exam,
          section: "speaking",
          difficulty,
          questionId: questionId ?? undefined,
          title: task.title,
          speakingScore: data.score,
          speakingScale: data.scoreScaleNote,
        });
      }
      onScored?.(data.score);
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
      <div className="card p-4">
        <p className="whitespace-pre-wrap text-ink">{task.prompt}</p>
        {task.stimulus && (
          <div className="mt-3 rounded-[7px] bg-paper border border-rule p-3 text-sm text-ink-soft whitespace-pre-wrap">
            {task.stimulus}
          </div>
        )}
        <div className="flex gap-4 text-xs text-ink-soft mt-3">
          <span>Persiapan: <span className="stat-num">{task.prepSeconds}s</span></span>
          <span>Waktu jawab: <span className="stat-num">{task.responseSeconds}s</span></span>
        </div>
      </div>

      {!readyToRecord ? (
        <div className="card p-4 flex flex-col gap-3" style={{ borderColor: "var(--gold)" }}>
          <p className="flex items-center gap-2 text-sm font-medium text-gold-ink">
            <ShieldAlert size={16} /> Pastikan kamu sudah siap sebelum merekam
          </p>
          <p className="text-sm text-ink-soft">
            Baca dulu soal &amp; instruksi di atas sampai benar-benar paham. Begitu kamu mulai
            rekam, sesi ini dianggap terpakai — sesi Speaking jumlahnya terbatas, jadi jangan
            sampai kepencet tidak sengaja.
          </p>
          <button onClick={() => setReadyToRecord(true)} className="btn btn-primary w-fit">
            <Mic size={16} /> Saya sudah siap, mulai rekam
          </button>
        </div>
      ) : (
        <AudioRecorder onTranscript={handleTranscript} disabled={loadingFeedback} />
      )}

      {transcript && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ink-soft mb-1">Transkrip jawabanmu:</p>
          <p className="italic text-ink">&ldquo;{transcript}&rdquo;</p>
        </div>
      )}

      {loadingFeedback && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> AI sedang menilai jawabanmu...
        </p>
      )}

      {error && <p className="text-sm text-red-ink">{error}</p>}

      {feedback && (
        <div className="card p-4 flex flex-col gap-3" style={{ borderColor: "var(--red)" }}>
          <div className="flex items-baseline gap-2">
            <span className="stat-num text-2xl" style={{ color: "var(--red-ink)" }}>
              {feedback.score}%
            </span>
            <span className="text-sm text-ink-soft">{feedback.scoreScaleNote}</span>
          </div>
          <div>
            <p className="font-medium text-sm text-ink mb-1">Kelebihan</p>
            <ul className="list-disc list-inside text-sm text-ink-soft">
              {feedback.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm text-ink mb-1">Yang perlu diperbaiki</p>
            <ul className="list-disc list-inside text-sm text-ink-soft">
              {feedback.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm text-ink mb-1">Contoh jawaban yang lebih baik</p>
            <p className="text-sm text-ink-soft italic">{feedback.correctedSample}</p>
          </div>
        </div>
      )}
    </div>
  );
}

