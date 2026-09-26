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
    <main className="min-h-screen bg-paper pb-24">
      <div className="container-page px-5 pt-8">
        <Link href="/latihan" className="page-head__back">
          <ArrowLeft size={15} /> Kembali ke Latihan
        </Link>

        {loading && (
          <div className="flex items-center gap-2 text-ink-faint text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Memuat sertifikat...
          </div>
        )}

        {error && (
          <p className="text-sm text-red-ink bg-red-tint border border-red rounded-[7px] p-3">
            {error}
          </p>
        )}

        {attempt && (
          <div
            className="relative overflow-hidden rounded-[10px] p-1.5"
            style={{ background: "var(--gold)" }}
          >
            <div className="bg-surface rounded-[7px] p-8 text-center border border-[var(--gold)]">
              <Award className="mx-auto text-gold-ink mb-3" size={36} />
              <p className="text-xs font-medium text-ink-faint tracking-[0.15em] mb-1">
                SERTIFIKAT HASIL LATIHAN
              </p>
              <h1 className="font-bold text-2xl text-ink mb-1">
                {attempt.score_breakdown.examLabel}
              </h1>
              <p className="text-sm text-ink-faint mb-6">
                {new Date(attempt.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                • Periode ujian {attempt.exam_period}
              </p>

              <div className="stat-num text-5xl mb-8" style={{ color: "var(--red-ink)" }}>
                {attempt.score_label}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {attempt.score_breakdown.breakdown.map((b, i) => (
                  <div key={i} className="rounded-[7px] bg-paper border border-rule p-3">
                    <p className="text-xs text-ink-faint mb-1">{b.label}</p>
                    <p className="stat-num text-sm">{b.value}</p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-[7px] border p-3 flex items-start gap-2 text-left"
                style={{ background: "var(--gold-tint)", borderColor: "var(--gold)" }}
              >
                <AlertTriangle size={16} className="text-gold-ink shrink-0 mt-0.5" />
                <p className="text-xs text-gold-ink">{attempt.score_breakdown.note}</p>
              </div>
            </div>
          </div>
        )}

        {attempt && (
          <div className="flex justify-center mt-6">
            <Link
              href={`/ujian/${attempt.exam}`}
              className="text-sm text-ink font-medium underline underline-offset-2"
            >
              Ambil Ujian {EXAM_LABELS[attempt.exam]} lagi bulan depan
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
