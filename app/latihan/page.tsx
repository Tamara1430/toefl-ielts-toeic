import Link from "next/link";
import { EXAM_LABELS, ExamType } from "@/lib/examConfig";
import { BookOpenText, Headphones, Mic, ChevronRight, Award } from "lucide-react";

const exams: ExamType[] = ["toefl", "ielts", "toeic"];

const descriptions: Record<ExamType, string> = {
  toefl: "Persiapan akademik untuk kuliah di luar negeri (gaya Amerika).",
  ielts: "Persiapan akademik & imigrasi (gaya Inggris/Australia/Kanada).",
  toeic: "Persiapan bahasa Inggris untuk dunia kerja & bisnis.",
};

const examAccent: Record<ExamType, string> = {
  toefl: "var(--pine)",
  ielts: "var(--gold)",
  toeic: "var(--red)",
};

const examTint: Record<ExamType, string> = {
  toefl: "var(--pine-tint)",
  ielts: "var(--gold-tint)",
  toeic: "var(--red-tint)",
};

export default function LatihanPage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head header-glow flex items-start justify-between !pb-5">
        <div className="anim-fade-up">
          <h1 className="page-head__title">Pilih latihan</h1>
          <p className="page-head__desc">
            Setiap exam punya 3 mode: Reading, Listening, dan Speaking.
          </p>
        </div>
        <Link
          href="/billing"
          className="text-xs text-ink-soft hover:text-ink font-medium shrink-0 pt-1 anim-fade-up"
        >
          Lihat paket
        </Link>
      </div>

      <div className="container-page px-5 pt-2">
        <div className="flex flex-col gap-4">
          {exams.map((exam, i) => (
            <div
              key={exam}
              className="card card-accent lift p-5 anim-fade-up stagger"
              style={{ ["--accent" as string]: examAccent[exam], ["--d" as string]: `${i * 90}ms` }}
            >
              <Link href={`/exam/${exam}`} className="flex items-center gap-4 group">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: examTint[exam], color: examAccent[exam] }}
                >
                  <BookOpenText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-lg text-ink">{EXAM_LABELS[exam]}</h2>
                  <p className="text-sm text-ink-soft mt-0.5">{descriptions[exam]}</p>
                  <div className="flex gap-3 text-ink-faint mt-3">
                    <BookOpenText size={16} />
                    <Headphones size={16} />
                    <Mic size={16} />
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </Link>
              <Link
                href={`/ujian/${exam}`}
                className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink mt-3 pt-3 border-t border-rule transition-colors"
              >
                <Award size={13} /> Sudah siap? Coba Ujian {EXAM_LABELS[exam]} &amp; dapatkan sertifikat
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-10 anim-fade-in">
          Ditenagai oleh Groq API (gpt-oss-120b, Whisper, Orpheus TTS + Edge TTS fallback)
        </p>
      </div>
    </main>
  );
}
