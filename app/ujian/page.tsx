import Link from "next/link";
import { EXAM_LABELS, ExamType, UJIAN_SECTION_TARGETS } from "@/lib/examConfig";
import { GraduationCap, FileCheck2, Clock, ChevronRight, Sparkles } from "lucide-react";

const exams: ExamType[] = ["toefl", "ielts", "toeic"];

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

function totalItems(exam: ExamType) {
  const t = UJIAN_SECTION_TARGETS[exam];
  return t.reading + t.listening + t.speaking;
}

export default function UjianIndexPage() {
  return (
    <main className="min-h-screen bg-paper pb-28">
      <div className="page-head header-glow !pb-6">
        <div className="anim-fade-up">
          <span className="tag tag-gold mb-3 inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Bersertifikat
          </span>
          <h1 className="page-head__title">Ujian resmi</h1>
          <p className="page-head__desc">
            Simulasi ujian penuh dengan waktu terbatas. Selesaikan untuk mendapatkan sertifikat
            digital.
          </p>
        </div>
      </div>

      <div className="container-page px-5 pt-2">
        <div className="flex flex-col gap-4">
          {exams.map((exam, i) => (
            <Link
              key={exam}
              href={`/ujian/${exam}`}
              className="card card-accent lift anim-fade-up stagger p-5 flex items-center gap-4 group"
              style={{ ["--accent" as string]: examAccent[exam], ["--d" as string]: `${i * 90}ms` }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 anim-float"
                style={{ background: examTint[exam], color: examAccent[exam], animationDelay: `${i * 300}ms` }}
              >
                <GraduationCap size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base text-ink">{EXAM_LABELS[exam]}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <FileCheck2 size={13} /> {totalItems(exam)} soal
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={13} /> Sesi penuh
                  </span>
                </div>
              </div>

              <ChevronRight
                size={20}
                className="text-ink-faint group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </Link>
          ))}
        </div>

        <div className="card p-4 mt-6 anim-fade-up stagger flex gap-3" style={{ ["--d" as string]: "280ms" }}>
          <Sparkles size={16} className="text-indigo shrink-0 mt-0.5" />
          <p className="text-xs text-ink-soft leading-relaxed">
            Mode Ujian dinilai seperti tes asli — sekali mulai, sesi berjalan dengan waktu terbatas
            dan tidak bisa diulang. Pastikan koneksi stabil sebelum memulai.
          </p>
        </div>
      </div>
    </main>
  );
}
