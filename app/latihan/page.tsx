import Link from "next/link";
import { EXAM_LABELS, ExamType } from "@/lib/examConfig";
import { BookOpenText, Headphones, Mic, ChevronRight } from "lucide-react";

const exams: ExamType[] = ["toefl", "ielts", "toeic"];

const descriptions: Record<ExamType, string> = {
  toefl: "Persiapan akademik untuk kuliah di luar negeri (gaya Amerika).",
  ielts: "Persiapan akademik & imigrasi (gaya Inggris/Australia/Kanada).",
  toeic: "Persiapan bahasa Inggris untuk dunia kerja & bisnis.",
};

export default function LatihanPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <h1 className="text-2xl font-bold text-neutral-900">Pilih Latihan</h1>
        <p className="text-neutral-500 mt-1 mb-6 text-sm">
          Setiap exam punya 3 mode: Reading, Listening, dan Speaking.
        </p>

        <div className="flex flex-col gap-4">
          {exams.map((exam) => (
            <Link
              key={exam}
              href={`/exam/${exam}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 hover:border-indigo-400 hover:shadow-md transition flex items-center gap-4"
            >
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-600">
                  {EXAM_LABELS[exam]}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">{descriptions[exam]}</p>
                <div className="flex gap-3 text-neutral-400 mt-3">
                  <BookOpenText size={16} />
                  <Headphones size={16} />
                  <Mic size={16} />
                </div>
              </div>
              <ChevronRight
                size={20}
                className="text-neutral-300 group-hover:text-indigo-500 transition shrink-0"
              />
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-10">
          Ditenagai oleh Groq API (gpt-oss-120b, Whisper, Orpheus TTS)
        </p>
      </div>
    </main>
  );
}
