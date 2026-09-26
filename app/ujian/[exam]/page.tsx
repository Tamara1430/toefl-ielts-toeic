"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ExamType, EXAM_LABELS, UJIAN_SECTION_TARGETS } from "@/lib/examConfig";
import { getEntitlement, canAccessUjian, Entitlements } from "@/lib/entitlements";
import UjianSession from "@/components/UjianSession";
import UjianTopBar from "@/components/UjianTopBar";
import { Lock, FileCheck2, Loader2, AlertTriangle } from "lucide-react";

const VALID_EXAMS: ExamType[] = ["toefl", "ielts", "toeic"];

export default function UjianPage({ params }: { params: Promise<{ exam: string }> }) {
  const { exam } = use(params);

  if (!VALID_EXAMS.includes(exam as ExamType)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-5">
        <p className="text-ink-soft text-sm">Exam tidak ditemukan.</p>
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

  // Once the session has actually started, UjianSession renders its own
  // UjianTopBar (with live step progress) — so we don't render a second
  // one here.
  if (started) {
    return (
      <main className="min-h-screen bg-paper pb-10">
        <UjianSession exam={exam} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      <UjianTopBar examLabel={EXAM_LABELS[exam]} exitHref="/latihan" />

      <div className="container-page px-5 pt-6">
        {checking && (
          <div className="flex items-center gap-2 text-ink-faint text-sm py-12 justify-center">
            <Loader2 size={18} className="animate-spin" /> Memeriksa akses...
          </div>
        )}

        {!checking && !eligible && (
          <div className="card p-6 text-center">
            <Lock className="mx-auto text-gold-ink mb-3" size={28} />
            <h3 className="text-lg font-bold text-ink mb-1">
              Ujian {EXAM_LABELS[exam]} adalah fitur berbayar
            </h3>
            <p className="text-sm text-ink-soft mb-4">
              Mode Ujian dan sertifikat hasil skor cuma tersedia untuk paket Ujian atau Premium{" "}
              {EXAM_LABELS[exam]}.
            </p>
            <Link href="/billing" className="btn btn-primary inline-flex">
              Lihat paket
            </Link>
          </div>
        )}

        {!checking && eligible && (
          <div className="card p-6">
            <FileCheck2 className="text-indigo mb-3" size={26} />
            <h2 className="text-lg font-bold text-ink mb-2">Sebelum mulai</h2>
            <ul className="text-sm text-ink-soft flex flex-col gap-1.5 mb-4 list-disc list-inside">
              <li>
                Terdiri dari {UJIAN_SECTION_TARGETS[exam].reading} soal Reading,{" "}
                {UJIAN_SECTION_TARGETS[exam].listening} Listening, dan{" "}
                {UJIAN_SECTION_TARGETS[exam].speaking} Speaking tingkat Mahir
              </li>
              <li>Kerjakan berurutan — begitu lanjut, tidak bisa kembali ke soal sebelumnya</li>
              <li>Soal diambil dari bank soal Mahir yang terus bertambah — bukan pool bulanan tetap</li>
              <li>Hasilnya langsung jadi sertifikat estimasi skor</li>
            </ul>
            <div className="rounded-[10px] border border-transparent bg-gold-tint p-3 flex items-start gap-2 mb-4">
              <AlertTriangle size={16} className="text-gold-ink shrink-0 mt-0.5" />
              <p className="text-xs text-gold-ink">
                Skor yang dihasilkan adalah <strong>estimasi dari simulasi latihan</strong>, bukan
                skor resmi dari lembaga TOEFL/IELTS/TOEIC yang sebenarnya.
              </p>
            </div>
            <button onClick={() => setStarted(true)} className="btn btn-primary">
              Mulai ujian
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
