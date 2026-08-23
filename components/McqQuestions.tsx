"use client";

import { useState } from "react";
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

  const score = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0),
    0
  );

  return (
    <div className="flex flex-col gap-6 mt-6">
      {questions.map((q, qi) => (
        <div key={qi} className="rounded-xl border border-neutral-200 p-4">
          <p className="font-medium mb-3">
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
                  className={`text-left rounded-lg border px-4 py-2.5 transition flex items-center justify-between gap-2
                    ${isSelected && !submitted ? "border-indigo-500 bg-indigo-50" : "border-neutral-200"}
                    ${isCorrect ? "border-green-500 bg-green-50" : ""}
                    ${isWrongSelected ? "border-red-500 bg-red-50" : ""}
                    ${!submitted ? "hover:border-indigo-300" : "cursor-default"}
                  `}
                >
                  <span>{opt}</span>
                  {isCorrect && <CheckCircle2 size={18} className="text-green-600 shrink-0" />}
                  {isWrongSelected && <XCircle size={18} className="text-red-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          {submitted && (
            <p className="text-sm text-neutral-600 mt-3 bg-neutral-50 rounded-lg p-3">
              <span className="font-medium">Penjelasan: </span>
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={() => {
            setSubmitted(true);
            onComplete?.(score, questions.length);
          }}
          disabled={Object.keys(answers).length < questions.length}
          className="rounded-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 text-white px-6 py-2.5 font-medium w-fit transition"
        >
          Cek Jawaban
        </button>
      ) : (
        <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 font-medium">
          Skor kamu: {score} / {questions.length}
        </div>
      )}
    </div>
  );
}
