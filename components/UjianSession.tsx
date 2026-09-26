"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExamType, EXAM_LABELS } from "@/lib/examConfig";
import McqQuestions, { McqQuestion } from "@/components/McqQuestions";
import DialoguePlayer from "@/components/DialoguePlayer";
import SpeakingSession, { SpeakingTask } from "@/components/SpeakingSession";
import UjianTopBar from "@/components/UjianTopBar";
import { Loader2, FileWarning, ArrowRight } from "lucide-react";

interface ReadingItem {
  id: string;
  payload: { title: string; passage: string; questions: McqQuestion[] };
}
interface ListeningItem {
  id: string;
  payload: {
    title: string;
    turns: { speaker: string; gender?: "male" | "female"; text: string; audioUrl?: string }[];
    questions: McqQuestion[];
  };
}
interface SpeakingItem {
  id: string;
  payload: SpeakingTask;
}

interface SessionData {
  exam: ExamType;
  period: string;
  reading: ReadingItem[];
  listening: ListeningItem[];
  speaking: SpeakingItem[];
}

type StepKind = "reading" | "listening" | "speaking";
interface Step {
  kind: StepKind;
  index: number; // index within that section's array
}

export default function UjianSession({ exam }: { exam: ExamType }) {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notReadyMessage, setNotReadyMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [readingResults, setReadingResults] = useState<{ correct: number; total: number }[]>([]);
  const [listeningResults, setListeningResults] = useState<{ correct: number; total: number }[]>([]);
  const [speakingScores, setSpeakingScores] = useState<number[]>([]);

  useEffect(() => {
    async function start() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/ujian/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ exam }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal memulai ujian.");
        if (json.notReady) {
          setNotReadyMessage(json.message);
          return;
        }
        setSession(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    start();
  }, [exam]);

  const steps: Step[] = session
    ? [
        ...session.reading.map((_, i) => ({ kind: "reading" as const, index: i })),
        ...session.listening.map((_, i) => ({ kind: "listening" as const, index: i })),
        ...session.speaking.map((_, i) => ({ kind: "speaking" as const, index: i })),
      ]
    : [];

  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const totalSteps = steps.length;

  async function handleSubmitAll(
    finalReading: typeof readingResults,
    finalListening: typeof listeningResults,
    finalSpeaking: typeof speakingScores
  ) {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/ujian/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: session.exam,
          period: session.period,
          readingResults: finalReading,
          listeningResults: finalListening,
          speakingScores: finalSpeaking,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan hasil ujian.");
      router.push(`/ujian/${exam}/sertifikat/${json.attemptId}`);
    } catch (e: any) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  function goNext() {
    if (isLastStep) return; // handled by per-type completion callbacks below
    setStepIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <>
        <UjianTopBar examLabel={EXAM_LABELS[exam]} exitHref="/latihan" />
        <div className="container-page px-5 pt-6">
          <div className="flex items-center gap-2 text-ink-faint text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Menyiapkan sesi ujian...
          </div>
        </div>
      </>
    );
  }

  if (notReadyMessage) {
    return (
      <>
        <UjianTopBar examLabel={EXAM_LABELS[exam]} exitHref="/latihan" />
        <div className="container-page px-5 pt-6">
          <div className="card p-6 text-center">
            <FileWarning className="mx-auto text-gold-ink mb-3" size={28} />
            <h3 className="text-lg font-bold text-ink mb-1">Ujian belum siap</h3>
            <p className="text-sm text-ink-soft">{notReadyMessage}</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <UjianTopBar examLabel={EXAM_LABELS[exam]} exitHref="/latihan" />
        <div className="container-page px-5 pt-6">
          <p className="text-sm text-red-ink bg-red-tint border border-transparent rounded-[10px] p-3">
            {error}
          </p>
        </div>
      </>
    );
  }

  if (submitting) {
    return (
      <>
        <UjianTopBar
          examLabel={EXAM_LABELS[exam]}
          step={totalSteps}
          totalSteps={totalSteps}
          exitHref="/latihan"
        />
        <div className="container-page px-5 pt-6">
          <div className="flex items-center gap-2 text-ink-faint text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Menghitung hasil & membuat sertifikat...
          </div>
        </div>
      </>
    );
  }

  if (!session || !currentStep) return null;

  return (
    <>
      <UjianTopBar
        examLabel={EXAM_LABELS[exam]}
        step={stepIndex + 1}
        totalSteps={totalSteps}
        exitHref="/latihan"
      />
      <div className="container-page px-5 pt-6">
        {currentStep.kind === "reading" && (
          <ReadingStep
            key={`r-${currentStep.index}`}
            item={session.reading[currentStep.index]}
            isLast={isLastStep}
            onDone={(correct, total) => {
              const next = [...readingResults, { correct, total }];
              setReadingResults(next);
              if (isLastStep) handleSubmitAll(next, listeningResults, speakingScores);
              else goNext();
            }}
          />
        )}

        {currentStep.kind === "listening" && (
          <ListeningStep
            key={`l-${currentStep.index}`}
            item={session.listening[currentStep.index]}
            isLast={isLastStep}
            onDone={(correct, total) => {
              const next = [...listeningResults, { correct, total }];
              setListeningResults(next);
              if (isLastStep) handleSubmitAll(readingResults, next, speakingScores);
              else goNext();
            }}
          />
        )}

        {currentStep.kind === "speaking" && (
          <div key={`s-${currentStep.index}`}>
            <h2 className="text-lg font-bold text-ink mb-3">
              {session.speaking[currentStep.index].payload.title}
            </h2>
            <SpeakingSession
              key={`s-${currentStep.index}`}
              exam={exam}
              difficulty="advanced"
              task={session.speaking[currentStep.index].payload}
              questionId={session.speaking[currentStep.index].id}
              skipHistory
              onScored={(score) => {
                const next = [...speakingScores, score];
                setSpeakingScores(next);
              }}
            />
            {speakingScores.length === currentStep.index + 1 && (
              <button
                onClick={() => {
                  if (isLastStep) handleSubmitAll(readingResults, listeningResults, speakingScores);
                  else goNext();
                }}
                className="btn btn-primary mt-5"
              >
                {isLastStep ? "Selesai & lihat sertifikat" : "Lanjut"} <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ReadingStep({
  item,
  isLast,
  onDone,
}: {
  item: ReadingItem;
  isLast: boolean;
  onDone: (correct: number, total: number) => void;
}) {
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  return (
    <div>
      <h2 className="font-bold text-lg text-ink mb-3">{item.payload.title}</h2>
      <div className="card p-4 leading-relaxed whitespace-pre-wrap mb-2">
        {item.payload.passage}
      </div>
      <McqQuestions
        questions={item.payload.questions}
        onComplete={(correct, total) => setResult({ correct, total })}
      />
      {result && (
        <button onClick={() => onDone(result.correct, result.total)} className="btn btn-primary mt-5">
          {isLast ? "Lanjut" : "Lanjut ke soal berikutnya"} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

function ListeningStep({
  item,
  isLast,
  onDone,
}: {
  item: ListeningItem;
  isLast: boolean;
  onDone: (correct: number, total: number) => void;
}) {
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  return (
    <div>
      <h2 className="font-bold text-lg text-ink mb-3">{item.payload.title}</h2>
      <div className="card p-4 mb-2">
        <DialoguePlayer turns={item.payload.turns} />
      </div>
      <McqQuestions
        questions={item.payload.questions}
        onComplete={(correct, total) => setResult({ correct, total })}
      />
      {result && (
        <button onClick={() => onDone(result.correct, result.total)} className="btn btn-primary mt-5">
          {isLast ? "Lanjut" : "Lanjut ke soal berikutnya"} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
