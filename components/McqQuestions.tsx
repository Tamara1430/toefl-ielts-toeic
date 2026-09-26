"use client";

import { useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export interface McqQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function McqQuestions({
  questions,
  onComplete,
}: {
  questions: McqQuestion[];
  onComplete?: (correct: number, total: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  // Guards against double-submit from a fast double-tap (React state updates
  // aren't synchronous, so `disabled={submitted}` alone can't catch a second
  // tap that lands before the re-render — a ref is checked/set immediately).
  const submittingRef = useRef(false);

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 mt-6">
      {questions.map((q, qi) => (
        <div key={qi} className="card p-4">
          <p className="font-medium text-ink mb-3">
            {qi + 1}. {q.question}
          </p>
          <div className="flex flex-col gap-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.correctIndex;
              const isWrongSelected = submitted && isSelected && oi !== q.correctIndex;

              return (
                <button
                  key={oi}
                  disabled={submitted}
                  onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                  className={`text-left rounded-[7px] border px-4 py-2.5 transition-colors flex items-center justify-between gap-2
                    ${isSelected && !submitted ? "border-ink bg-[var(--paper)]" : "border-rule-strong"}
                    ${isCorrect ? "border-pine" : ""}
                    ${isCorrect ? "" : ""}
                    ${isWrongSelected ? "border-red" : ""}
                    ${!submitted ? "hover:border-ink" : "cursor-default"}
                  `}
                  style={
                    isCorrect
                      ? { background: "var(--pine-tint)" }
                      : isWrongSelected
                      ? { background: "var(--red-tint)" }
                      : undefined
                  }
                >
                  <span className="text-sm text-ink">{opt}</span>
                  {isCorrect && <CheckCircle2 size={18} className="text-pine shrink-0" />}
                  {isWrongSelected && <XCircle size={18} className="text-red shrink-0" />}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="text-sm text-ink-soft mt-3 bg-paper rounded-[7px] p-3 border border-rule">
              <span className="font-medium text-ink">Penjelasan: </span>
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => {
            if (submittingRef.current) return;
            submittingRef.current = true;
            setSubmitted(true);
            onComplete?.(score, questions.length);
          }}
          disabled={Object.keys(answers).length < questions.length}
          className="btn btn-primary w-fit"
        >
          Cek jawaban
        </button>
      ) : (
        <div
          className="rounded-[7px] border px-4 py-3 font-medium text-ink"
          style={{ background: "var(--gold-tint)", borderColor: "var(--gold)" }}
        >
          Skor kamu: <span className="stat-num">{score} / {questions.length}</span>
        </div>
      )}
    </div>
  );
}
