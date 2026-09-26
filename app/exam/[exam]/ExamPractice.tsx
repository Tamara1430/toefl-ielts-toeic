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
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head !pb-4">
        <div className="flex items-center justify-between mb-3">
          <Link href="/latihan" className="page-head__back !mb-0">
            <ArrowLeft size={15} /> Kembali ke Latihan
          </Link>
          <Link
            href={`/progress?exam=${exam}`}
            className="inline-flex items-center gap-1.5 text-sm text-ink font-medium"
          >
            <BarChart3 size={16} /> Progress
          </Link>
        </div>
        <h1 className="page-head__title">{EXAM_LABELS[exam]}</h1>
        <p className="page-head__desc">Latihan soal dari bank soal AI.</p>
      </div>

      <div className="container-page px-5 pt-6">
        {/* Section tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {sections.map((s) => (
            <button
              key={s}
              onClick={() => changeSection(s)}
              className={`px-4 py-2 rounded-[7px] text-sm font-medium transition-colors border ${
                section === s
                  ? "bg-ink text-surface border-ink"
                  : "bg-surface text-ink-soft border-rule-strong hover:border-ink"
              }`}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary mb-8">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Mengambil soal..." : "Ambil soal"}
        </button>

        {error && (
          <p className="text-sm text-red-ink bg-red-tint border border-red rounded-[7px] p-3 mb-6">
            {error}
          </p>
        )}

        {quotaExceeded && (
          <div className="card p-6 text-center" style={{ borderColor: "var(--gold)" }}>
            <Lock className="mx-auto text-gold-ink mb-3" size={28} />
            <h3 className="font-bold text-lg text-ink mb-1">
              Kuota gratis {SECTION_LABELS[section].toLowerCase()} sudah habis
            </h3>
            <p className="text-sm text-ink-soft mb-4">
              Kamu sudah kerjakan semua soal {SECTION_LABELS[section].toLowerCase()} gratis untuk{" "}
              {EXAM_LABELS[exam]}. Upgrade ke Premium {EXAM_LABELS[exam]} untuk latihan tanpa
              batas, plus akses Ujian dan sertifikat hasil skor.
            </p>
            <Link href="/billing" className="btn btn-primary inline-flex">
              Lihat paket
            </Link>
          </div>
        )}

        {audioPending && (
          <div className="card p-6 text-center">
            <Headphones className="mx-auto text-ink-soft mb-3" size={28} />
            <h3 className="font-bold text-lg text-ink mb-1">Soal ada, tapi audionya belum siap</h3>
            <p className="text-sm text-ink-soft mb-1">
              Ada soal listening untuk {EXAM_LABELS[exam]} yang belum kamu kerjakan, tapi
              suaranya masih diproses admin.
            </p>
            <p className="text-sm text-ink-faint">Tunggu sebentar lalu coba lagi, ya.</p>
          </div>
        )}

        {outOfStock && (
          <div className="card p-6 text-center">
            <PackageX className="mx-auto text-ink-soft mb-3" size={28} />
            <h3 className="font-bold text-lg text-ink mb-1">Stok soal habis untuk ini</h3>
            <p className="text-sm text-ink-soft mb-1">
              Kamu sudah mengerjakan semua soal {SECTION_LABELS[section].toLowerCase()} yang
              tersedia untuk {EXAM_LABELS[exam]}.
            </p>
            <p className="text-sm text-ink-faint">
              Soal baru ditambahkan otomatis secara berkala — coba lagi nanti, atau coba mode
              lain dulu.
            </p>
          </div>
        )}

        {!data && !loading && !outOfStock && !audioPending && !quotaExceeded && (
          <p className="text-ink-faint text-sm">
            Klik &ldquo;Ambil soal&rdquo; untuk mulai latihan {SECTION_LABELS[section].toLowerCase()}.
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
      <h2 className="font-bold text-lg text-ink mb-3">{data.title}</h2>
      <div className="card p-4 leading-relaxed whitespace-pre-wrap text-[0.95rem]">
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
      <h2 className="font-bold text-lg text-ink mb-3">{data.title}</h2>
      <div className="card p-4">
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
