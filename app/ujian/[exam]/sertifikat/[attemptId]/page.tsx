"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { EXAM_LABELS, ExamType } from "@/lib/examConfig";
import { CertificateScore } from "@/lib/scoreConversion";
import { Award, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

interface Attempt {
  id: string;
  exam: ExamType;
  exam_period: string;
  score_label: string;
  score_breakdown: CertificateScore;
  created_at: string;
}

export default function SertifikatPage({
  params,
}: {
  params: Promise<{ exam: string; attemptId: string }>;
}) {
  const { exam, attemptId } = use(params);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/ujian/${attemptId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setAttempt(json.attempt);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [attemptId]);

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-2xl mx-auto px-5 pt-8">
        <Link
          href="/latihan"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-6"
        >
          <ArrowLeft size={16} /> Kembali ke Latihan
        </Link>

        {loading && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Memuat sertifikat...
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        {attempt && (
          <div className="rounded-2xl border-2 border-indigo-200 bg-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />

            <Award className="mx-auto text-indigo-500 mb-3" size={40} />
            <p className="text-xs font-medium text-neutral-400 tracking-wide mb-1">
              SERTIFIKAT HASIL LATIHAN
            </p>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">
              {attempt.score_breakdown.examLabel}
            </h1>
            <p className="text-sm text-neutral-400 mb-6">
              {new Date(attempt.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              • Periode ujian {attempt.exam_period}
            </p>

            <div className="text-5xl font-bold text-indigo-600 mb-8">{attempt.score_label}</div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {attempt.score_breakdown.breakdown.map((b, i) => (
                <div key={i} className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                  <p className="text-xs text-neutral-400 mb-1">{b.label}</p>
                  <p className="font-semibold text-neutral-900">{b.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 text-left">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{attempt.score_breakdown.note}</p>
            </div>
          </div>
        )}

        {attempt && (
          <div className="flex justify-center mt-6">
            <Link
              href={`/ujian/${attempt.exam}`}
              className="text-sm text-indigo-600 font-medium"
            >
              Ambil Ujian {EXAM_LABELS[attempt.exam]} lagi bulan depan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
