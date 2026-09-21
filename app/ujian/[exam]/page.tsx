"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ExamType, EXAM_LABELS } from "@/lib/examConfig";
import { getEntitlement, canAccessUjian, Entitlements } from "@/lib/entitlements";
import UjianSession from "@/components/UjianSession";
import { ArrowLeft, Lock, FileCheck2, Loader2, AlertTriangle } from "lucide-react";

const VALID_EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];

export default function UjianPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = use(params);

  if (!VALID_EXAMS.includes(exam as ExamType)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-5">
        <p className="text-neutral-500 text-sm">Exam tidak ditemukan.</p>
      </main>
    );
  }

  return <UjianPageInner exam={exam as ExamType} />;
}

function UjianPageInner({ exam }: { exam: ExamType }) {
  const [checking, setChecking] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("entitlements")
        .eq("id", user.id)
        .single();
      const level = getEntitlement(profile?.entitlements as Entitlements, exam);
      setEligible(canAccessUjian(level));
      setChecking(false);
    }
    check();
  }, [exam]);

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <Link
          href="/latihan"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 mb-4"
        >
          <ArrowLeft size={16} /> Kembali ke Latihan
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Ujian {EXAM_LABELS[exam]}</h1>
        <p className="text-neutral-500 mb-6 text-sm">
          Simulasi ujian tingkat lanjut — hasilnya jadi sertifikat estimasi skor.
        </p>

        {checking && (
          <div className="flex items-center gap-2 text-neutral-400 text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Memeriksa akses...
          </div>
        )}

        {!checking && !eligible && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
            <Lock className="mx-auto text-indigo-500 mb-3" size={32} />
            <h3 className="font-semibold text-neutral-900 mb-1">
              Ujian {EXAM_LABELS[exam]} adalah fitur berbayar
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Mode Ujian dan sertifikat hasil skor cuma tersedia untuk paket Ujian atau Premium{" "}
              {EXAM_LABELS[exam]}.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium transition"
            >
              Lihat Paket
            </Link>
          </div>
        )}

        {!checking && eligible && !started && (
          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <FileCheck2 className="text-indigo-600 mb-3" size={28} />
            <h2 className="font-semibold text-neutral-900 mb-2">Sebelum mulai</h2>
            <ul className="text-sm text-neutral-600 flex flex-col gap-1.5 mb-4 list-disc list-inside">
              <li>Terdiri dari 2 soal Reading, 2 Listening, dan 2 Speaking tingkat Mahir</li>
              <li>Kerjakan berurutan — begitu lanjut, tidak bisa kembali ke soal sebelumnya</li>
              <li>Soal ujian diganti tiap bulan, sama untuk semua peserta bulan ini</li>
              <li>Hasilnya langsung jadi sertifikat estimasi skor</li>
            </ul>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Skor yang dihasilkan adalah <strong>estimasi dari simulasi latihan</strong>, bukan
                skor resmi dari lembaga TOEFL/IELTS/TOEIC yang sebenarnya.
              </p>
            </div>
            <button
              onClick={() => setStarted(true)}
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 font-medium transition"
            >
              Mulai Ujian
            </button>
          </div>
        )}

        {!checking && eligible && started && <UjianSession exam={exam} />}
      </div>
    </main>
  );
}
