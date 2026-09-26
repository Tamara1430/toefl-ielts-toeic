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

export default function LatihanPage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head flex items-start justify-between !pb-4">
        <div>
          <h1 className="page-head__title">Pilih latihan</h1>
          <p className="page-head__desc">
            Setiap exam punya 3 mode: Reading, Listening, dan Speaking.
          </p>
        </div>
        <Link href="/billing" className="text-xs text-ink-soft hover:text-ink font-medium shrink-0 pt-1">
          Lihat paket
        </Link>
      </div>

      <div className="container-page px-5 pt-6">
        <div className="flex flex-col gap-4">
          {exams.map((exam) => (
            <div key={exam} className="card p-5" style={{ borderLeft: `3px solid ${examAccent[exam]}` }}>
              <Link href={`/exam/${exam}`} className="flex items-center gap-4 group">
                <div className="flex-1">
                  <h2 className="font-serif text-lg text-ink">{EXAM_LABELS[exam]}</h2>
                  <p className="text-sm text-ink-soft mt-0.5">{descriptions[exam]}</p>
                  <div className="flex gap-3 text-ink-faint mt-3">
                    <BookOpenText size={16} />
                    <Headphones size={16} />
                    <Mic size={16} />
                  </div>
                </div>
                <ChevronRight
                  size={20}
                  className="text-ink-faint group-hover:text-ink transition-colors shrink-0"
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

        <p className="text-center text-xs text-ink-faint mt-10">
          Ditenagai oleh Groq API (gpt-oss-120b, Whisper, Orpheus TTS + Edge TTS fallback)
        </p>
      </div>
    </main>
  );
}
