"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExamType,
  SectionType,
  Difficulty,
  EXAM_LABELS,
  SECTION_LABELS,
} from "@/lib/examConfig";
import { recordSession } from "@/lib/history";
import McqQuestions, { McqQuestion } from "@/components/McqQuestions";
import DialoguePlayer from "@/components/DialoguePlayer";
import SpeakingSession, { SpeakingTask } from "@/components/SpeakingSession";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  BarChart3,
  PackageX,
  Headphones,
  Lock,
} from "lucide-react";

interface ReadingData {
  title: string;
  passage: string;
  questions: McqQuestion[];
}

interface ListeningData {
  title: string;
  turns: { speaker: string; gender?: "male" | "female"; text: string; audioUrl?: string }[];
  questions: McqQuestion[];
}

type GeneratedData = ReadingData | ListeningData | SpeakingTask;

const sections: SectionType[] = ["reading", "listening", "speaking"];

export default function ExamPractice({ exam }: { exam: ExamType }) {
  const [section, setSection] = useState<SectionType>("reading");
  const [data, setData] = useState<GeneratedData | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [pickedDifficulty, setPickedDifficulty] = useState<Difficulty>("intermediate");
  const [outOfStock, setOutOfStock] = useState(false);
  const [audioPending, setAudioPending] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setData(null);
    setOutOfStock(false);
    setAudioPending(false);
    setQuotaExceeded(false);
    try {
      const res = await fetch("/api/practice/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, section }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengambil soal.");

      if (json.quotaExceeded) {
        setQuotaExceeded(true);
        return;
      }
      if (json.audioPending) {
        setAudioPending(true);
        return;
      }
      if (json.outOfStock) {
        setOutOfStock(true);
        return;
      }
      setData(json.data);
      setQuestionId(json.questionId);
      if (json.difficulty) setPickedDifficulty(json.difficulty);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function changeSection(s: SectionType) {
    setSection(s);
    setData(null);
    setQuestionId(null);
    setOutOfStock(false);
    setAudioPending(false);
    setQuotaExceeded(false);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/latihan"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
          >
            <ArrowLeft size={16} /> Kembali ke Latihan
          </Link>
          <Link
            href={`/progress?exam=${exam}`}
            className="inline-flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:text-indigo-800"
          >
            <BarChart3 size={16} /> Progress
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-1">{EXAM_LABELS[exam]}</h1>
        <p className="text-neutral-500 mb-6 text-sm">Latihan soal dari bank soal AI</p>

        {/* Section tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => changeSection(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                section === s
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
              }`}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 font-medium transition mb-8"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? "Mengambil soal..." : "Ambil Soal"}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            {error}
          </p>
        )}

        {quotaExceeded && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 text-center">
            <Lock className="mx-auto text-indigo-500 mb-3" size={32} />
            <h3 className="font-semibold text-neutral-900 mb-1">
              Kuota gratis {SECTION_LABELS[section].toLowerCase()} sudah habis
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Kamu sudah kerjakan semua soal {SECTION_LABELS[section].toLowerCase()} gratis untuk{" "}
              {EXAM_LABELS[exam]}. Upgrade ke Premium {EXAM_LABELS[exam]} untuk latihan tanpa
              batas, plus akses Ujian dan sertifikat hasil skor.
            </p>
            <Link
              href="/billing"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 font-medium transition"
            >
              Lihat Paket
            </Link>
          </div>
        )}

        {audioPending && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
            <Headphones className="mx-auto text-blue-500 mb-3" size={32} />
            <h3 className="font-semibold text-neutral-900 mb-1">
              Soal ada, tapi audionya belum siap 🎧
            </h3>
            <p className="text-sm text-neutral-600 mb-1">
              Ada soal listening untuk {EXAM_LABELS[exam]} yang belum kamu kerjakan, tapi
              suaranya masih diproses admin.
            </p>
            <p className="text-sm text-neutral-500">Tunggu sebentar lalu coba lagi, ya.</p>
          </div>
        )}

        {outOfStock && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <PackageX className="mx-auto text-amber-500 mb-3" size={32} />
            <h3 className="font-semibold text-neutral-900 mb-1">
              Waduh, stok soal habis untuk ini 🙏
            </h3>
            <p className="text-sm text-neutral-600 mb-1">
              Kamu sudah mengerjakan semua soal {SECTION_LABELS[section].toLowerCase()} yang
              tersedia untuk {EXAM_LABELS[exam]}.
            </p>
            <p className="text-sm text-neutral-500">
              Soal baru ditambahkan otomatis secara berkala — coba lagi nanti, atau coba mode
              lain dulu.
            </p>
          </div>
        )}

        {!data && !loading && !outOfStock && !audioPending && !quotaExceeded && (
          <p className="text-neutral-400 text-sm">
            Klik &ldquo;Ambil Soal&rdquo; untuk mulai latihan {SECTION_LABELS[section].toLowerCase()}.
          </p>
        )}

        {data && section === "reading" && (
          <ReadingView
            data={data as ReadingData}
            exam={exam}
            difficulty={pickedDifficulty}
            questionId={questionId}
          />
        )}
        {data && section === "listening" && (
          <ListeningView
            data={data as ListeningData}
            exam={exam}
            difficulty={pickedDifficulty}
            questionId={questionId}
          />
        )}
        {data && section === "speaking" && (
          <SpeakingSession
            exam={exam}
            difficulty={pickedDifficulty}
            task={data as SpeakingTask}
            questionId={questionId}
          />
        )}
      </div>
    </main>
  );
}

function ReadingView({
  data,
  exam,
  difficulty,
  questionId,
}: {
  data: ReadingData;
  exam: ExamType;
  difficulty: Difficulty;
  questionId: string | null;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">{data.title}</h2>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 leading-relaxed whitespace-pre-wrap">
        {data.passage}
      </div>
      <McqQuestions
        questions={data.questions}
        onComplete={(correct, total) =>
          recordSession({
            exam,
            section: "reading",
            difficulty,
            questionId: questionId ?? undefined,
            title: data.title,
            correct,
            total,
          })
        }
      />
    </div>
  );
}

function ListeningView({
  data,
  exam,
  difficulty,
  questionId,
}: {
  data: ListeningData;
  exam: ExamType;
  difficulty: Difficulty;
  questionId: string | null;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">{data.title}</h2>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <DialoguePlayer turns={data.turns} />
      </div>
      <McqQuestions
        questions={data.questions}
        onComplete={(correct, total) =>
          recordSession({
            exam,
            section: "listening",
            difficulty,
            questionId: questionId ?? undefined,
            title: data.title,
            correct,
            total,
          })
        }
      />
    </div>
  );
}
