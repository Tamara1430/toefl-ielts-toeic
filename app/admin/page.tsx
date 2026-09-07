"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXAM_LABELS,
  SECTION_LABELS,
  DIFFICULTY_LABELS,
  ExamType,
  SectionType,
  Difficulty,
} from "@/lib/examConfig";
import AdminQuestionList from "@/components/AdminQuestionList";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Volume2,
  Target,
  X,
  ChevronDown,
  Wand2,
} from "lucide-react";

interface StockRow {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  count: number;
}

interface StepInfo {
  exam?: ExamType;
  section?: SectionType;
  difficulty?: Difficulty;
  index?: number;
  total?: number;
  questionId?: string;
  title?: string;
  speaker?: string;
  turnIndex?: number;
  totalTurns?: number;
}

const exams: ExamType[] = ["toefl", "ielts", "toeic"];
const sections: SectionType[] = ["reading", "listening", "speaking"];
const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];

async function createJob(kind: "questions" | "voices"): Promise<string> {
  const res = await fetch("/api/admin/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Gagal membuat job.");
  return json.jobId as string;
}

async function cancelJob(jobId: string) {
  await fetch(`/api/admin/jobs/${jobId}/cancel`, { method: "POST" });
}

/** Polls a job's current_step every 1.5s while `active` is true. */
function useJobProgress(jobId: string | null, active: boolean) {
  const [step, setStep] = useState<StepInfo | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active || !jobId) {
      setStep(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/jobs/${jobId}`);
        const json = await res.json();
        setStep(json.job?.current_step ?? null);
      } catch {
        // ignore transient poll errors
      }
    }, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId, active]);

  return step;
}

function StepBadge({ step }: { step: StepInfo }) {
  if (step.exam && step.section && step.difficulty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-full px-3 py-1.5">
        <Sparkles size={12} className="animate-pulse" />
        Sedang generate: {EXAM_LABELS[step.exam]} / {SECTION_LABELS[step.section]} /{" "}
        {DIFFICULTY_LABELS[step.difficulty]}
        {step.index && step.total ? ` (${step.index}/${step.total})` : ""}
      </span>
    );
  }
  if (step.questionId) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded-full px-3 py-1.5">
        <Volume2 size={12} className="animate-pulse" />
        Sedang generate suara: {step.title ?? "..."} — {step.speaker} (giliran {step.turnIndex}/
        {step.totalTurns})
      </span>
    );
  }
  return null;
}

export default function AdminStockPage() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [minPoolSize, setMinPoolSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Generate umum
  const [generatingAll, setGeneratingAll] = useState(false);
  const [allJobId, setAllJobId] = useState<string | null>(null);
  const [lastResultAll, setLastResultAll] = useState<string | null>(null);
  const stepAll = useJobProgress(allJobId, generatingAll);

  // Generate spesifik
  const [specExam, setSpecExam] = useState<ExamType>("toefl");
  const [specSection, setSpecSection] = useState<SectionType>("reading");
  const [specDifficulty, setSpecDifficulty] = useState<Difficulty>("intermediate");
  const [specCount, setSpecCount] = useState(5);
  const [generatingSpecific, setGeneratingSpecific] = useState(false);
  const [specJobId, setSpecJobId] = useState<string | null>(null);
  const [lastResultSpecific, setLastResultSpecific] = useState<string | null>(null);
  const stepSpecific = useJobProgress(specJobId, generatingSpecific);

  // Generate voices
  const [generatingVoices, setGeneratingVoices] = useState(false);
  const [voicesJobId, setVoicesJobId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<{ processed: number; total: number } | null>(
    null
  );
  const [voiceErrors, setVoiceErrors] = useState<string[]>([]);
  const stepVoices = useJobProgress(voicesJobId, generatingVoices);

  // Fix gender (migration for old listening questions missing gender data)
  const [fixingGender, setFixingGender] = useState(false);
  const [genderProgress, setGenderProgress] = useState<{ processed: number; total: number } | null>(
    null
  );
  const [genderErrors, setGenderErrors] = useState<string[]>([]);
  const [genderCountLoading, setGenderCountLoading] = useState(true);

  async function loadStock() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stock");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat stok.");
      setStock(json.stock);
      setMinPoolSize(json.minPoolSize);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadGenderCount() {
    setGenderCountLoading(true);
    try {
      const res = await fetch("/api/admin/fix-gender");
      const json = await res.json();
      if (res.ok) {
        setGenderProgress({ processed: 0, total: json.totalNeeding });
      }
    } catch {
      // non-critical — just skip showing the count if this fails
    } finally {
      setGenderCountLoading(false);
    }
  }

  useEffect(() => {
    loadStock();
    loadGenderCount();
  }, []);

  async function handleGenerateAll() {
    setGeneratingAll(true);
    setError(null);
    setLastResultAll(null);
    let jobId: string | null = null;
    try {
      jobId = await createJob("questions");
      setAllJobId(jobId);
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate.");
      setLastResultAll(
        `${json.totalGenerated} soal baru ditambahkan.${
          json.cancelled ? " (dibatalkan — sisanya belum diproses)" : ""
        }${
          json.rateLimited
            ? " ⚠️ Berhenti karena kelihatannya kena rate limit/kuota harian Groq — coba lagi nanti atau besok."
            : ""
        }`
      );
      await loadStock();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingAll(false);
      setAllJobId(null);
    }
  }

  async function handleGenerateSpecific() {
    setGeneratingSpecific(true);
    setError(null);
    setLastResultSpecific(null);
    let jobId: string | null = null;
    try {
      jobId = await createJob("questions");
      setSpecJobId(jobId);
      const res = await fetch("/api/admin/generate-specific", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: specExam,
          section: specSection,
          difficulty: specDifficulty,
          count: specCount,
          jobId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate.");
      const r = json.result;
      setLastResultSpecific(
        `${r.generated} soal baru untuk ${EXAM_LABELS[specExam]} / ${SECTION_LABELS[specSection]} / ${DIFFICULTY_LABELS[specDifficulty]}${
          json.cancelled ? " (dibatalkan)" : ""
        }${r.errors.length ? ` — ${r.errors.length} gagal` : ""}.${
          json.rateLimited
            ? " ⚠️ Berhenti karena kelihatannya kena rate limit/kuota harian Groq."
            : ""
        }`
      );
      await loadStock();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingSpecific(false);
      setSpecJobId(null);
    }
  }

  async function handleGenerateVoices() {
    setGeneratingVoices(true);
    setError(null);
    setVoiceErrors([]);
    setVoiceProgress(null);

    let jobId: string | null = null;
    let totalProcessed = 0;
    let remaining = 1;
    let cancelled = false;

    try {
      jobId = await createJob("voices");
      setVoicesJobId(jobId);

      while (remaining > 0 && !cancelled) {
        const res = await fetch("/api/admin/generate-voices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal generate voices.");

        totalProcessed += json.processed;
        remaining = json.remaining;
        cancelled = json.cancelled;
        setVoiceProgress({ processed: totalProcessed, total: totalProcessed + remaining });
        if (json.errors?.length) setVoiceErrors((prev) => [...prev, ...json.errors]);

        if (json.processed === 0 && remaining > 0 && !cancelled) break;
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingVoices(false);
      setVoicesJobId(null);
    }
  }

  async function handleFixGender() {
    setFixingGender(true);
    setError(null);
    setGenderErrors([]);
    setGenderProgress(null);

    let totalProcessed = 0;
    let remaining = 1;

    try {
      while (remaining > 0) {
        const res = await fetch("/api/admin/fix-gender", { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal perbaiki gender.");

        totalProcessed += json.processed;
        remaining = json.remaining;
        setGenderProgress({ processed: totalProcessed, total: totalProcessed + remaining });
        if (json.errors?.length) setGenderErrors((prev) => [...prev, ...json.errors]);

        if (json.processed === 0 && remaining > 0) break; // safety
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFixingGender(false);
    }
  }

  function comboKey(exam: ExamType, section: SectionType, difficulty: Difficulty) {
    return `${exam}-${section}-${difficulty}`;
  }

  function isRowActive(row: StockRow): boolean {
    const matchAll =
      stepAll?.exam === row.exam &&
      stepAll?.section === row.section &&
      stepAll?.difficulty === row.difficulty;
    const matchSpecific =
      stepSpecific?.exam === row.exam &&
      stepSpecific?.section === row.section &&
      stepSpecific?.difficulty === row.difficulty;
    return Boolean(matchAll || matchSpecific);
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      {/* Stok */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-neutral-900">Stok Bank Soal</h2>
            <p className="text-xs text-neutral-400">
              Auto top-up kalau di bawah {minPoolSize} soal per kombinasi (cron tiap jam). Klik
              baris untuk lihat detail soalnya.
            </p>
          </div>
          <button
            onClick={loadStock}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:border-neutral-400 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 text-left text-neutral-500">
                <th className="px-4 py-2.5 font-medium">Exam</th>
                <th className="px-4 py-2.5 font-medium">Section</th>
                <th className="px-4 py-2.5 font-medium">Kesulitan</th>
                <th className="px-4 py-2.5 font-medium text-right">Stok</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {stock.map((row, i) => {
                const low = row.count < minPoolSize;
                const key = comboKey(row.exam, row.section, row.difficulty);
                const expanded = expandedKey === key;
                const active = isRowActive(row);
                return (
                  <>
                    <tr
                      key={i}
                      onClick={() => setExpandedKey(expanded ? null : key)}
                      className={`cursor-pointer hover:bg-neutral-50 transition ${
                        active ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">{EXAM_LABELS[row.exam]}</td>
                      <td className="px-4 py-2.5">{SECTION_LABELS[row.section]}</td>
                      <td className="px-4 py-2.5">{DIFFICULTY_LABELS[row.difficulty]}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            low ? "text-amber-600" : "text-neutral-900"
                          }`}
                        >
                          {low && <AlertTriangle size={13} />}
                          {row.count}
                          {active && (
                            <Sparkles size={12} className="text-indigo-500 animate-pulse ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-2 text-neutral-300">
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={5} className="bg-neutral-50 px-3 py-2">
                          <AdminQuestionList
                            exam={row.exam}
                            section={row.section}
                            difficulty={row.difficulty}
                            activeQuestionId={stepVoices?.questionId ?? null}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {stock.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Umum */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-neutral-900 text-sm">Generate Umum</h3>
            <p className="text-xs text-neutral-400">
              Cek semua kombinasi, top-up otomatis yang stoknya di bawah ambang batas.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition"
            >
              {generatingAll ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {generatingAll ? "Generating..." : "Generate Umum"}
            </button>
            {generatingAll && allJobId && (
              <button
                onClick={() => cancelJob(allJobId)}
                className="flex items-center gap-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 text-sm font-medium transition"
              >
                <X size={14} /> Batalkan
              </button>
            )}
          </div>
        </div>
        {stepAll && (
          <div className="mt-3">
            <StepBadge step={stepAll} />
          </div>
        )}
        {lastResultAll && <p className="text-xs text-green-700 mt-3">{lastResultAll}</p>}
      </div>

      {/* Generate Spesifik */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Target size={15} className="text-indigo-600" />
          <h3 className="font-medium text-neutral-900 text-sm">Generate Spesifik</h3>
        </div>
        <p className="text-xs text-neutral-400 mb-3">
          Prioritaskan 1 kombinasi tertentu, tanpa nunggu giliran di "Generate Umum".
        </p>
        <div className="grid sm:grid-cols-4 gap-2 mb-3">
          <select
            value={specExam}
            onChange={(e) => setSpecExam(e.target.value as ExamType)}
            className="rounded-lg border border-neutral-200 px-2.5 py-2 text-sm"
          >
            {exams.map((e) => (
              <option key={e} value={e}>
                {EXAM_LABELS[e]}
              </option>
            ))}
          </select>
          <select
            value={specSection}
            onChange={(e) => setSpecSection(e.target.value as SectionType)}
            className="rounded-lg border border-neutral-200 px-2.5 py-2 text-sm"
          >
            {sections.map((s) => (
              <option key={s} value={s}>
                {SECTION_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={specDifficulty}
            onChange={(e) => setSpecDifficulty(e.target.value as Difficulty)}
            className="rounded-lg border border-neutral-200 px-2.5 py-2 text-sm"
          >
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={20}
            value={specCount}
            onChange={(e) => setSpecCount(Number(e.target.value))}
            className="rounded-lg border border-neutral-200 px-2.5 py-2 text-sm"
            placeholder="Jumlah"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSpecific}
            disabled={generatingSpecific}
            className="flex items-center gap-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition"
          >
            {generatingSpecific ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generatingSpecific ? "Generating..." : "Generate Kombinasi Ini"}
          </button>
          {generatingSpecific && specJobId && (
            <button
              onClick={() => cancelJob(specJobId)}
              className="flex items-center gap-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 text-sm font-medium transition"
            >
              <X size={14} /> Batalkan
            </button>
          )}
        </div>
        {stepSpecific && (
          <div className="mt-3">
            <StepBadge step={stepSpecific} />
          </div>
        )}
        {lastResultSpecific && <p className="text-xs text-green-700 mt-3">{lastResultSpecific}</p>}
      </div>

      {/* Generate Voices */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Volume2 size={15} className="text-indigo-600" />
              <h3 className="font-medium text-neutral-900 text-sm">Generate Voices</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Cek semua soal listening yang audionya belum ter-cache (soal lama / gagal saat
              generate), lalu buatkan audionya. Aman dijalankan berkali-kali.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleGenerateVoices}
              disabled={generatingVoices}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition"
            >
              {generatingVoices ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Volume2 size={14} />
              )}
              {generatingVoices ? "Memproses..." : "Generate Voices"}
            </button>
            {generatingVoices && voicesJobId && (
              <button
                onClick={() => cancelJob(voicesJobId)}
                className="flex items-center gap-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 text-sm font-medium transition"
              >
                <X size={14} /> Batalkan
              </button>
            )}
          </div>
        </div>

        {stepVoices && (
          <div className="mt-3">
            <StepBadge step={stepVoices} />
          </div>
        )}

        {voiceProgress && (
          <p className="text-xs text-neutral-600 mt-3">
            Diproses {voiceProgress.processed} dari {voiceProgress.total} soal listening yang
            butuh audio.
            {!generatingVoices && voiceProgress.total > 0 && voiceProgress.processed === 0 && (
              <span className="text-green-700"> Semua soal listening sudah punya audio ✓</span>
            )}
          </p>
        )}
        {voiceErrors.length > 0 && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 max-h-32 overflow-y-auto">
            {voiceErrors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Fix Gender (migration for old listening questions) */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Wand2 size={15} className="text-indigo-600" />
              <h3 className="font-medium text-neutral-900 text-sm">Perbaiki Gender Suara</h3>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-md">
              Untuk soal listening lama yang dibuat sebelum sistem gender-aware ada (kadang suara
              tidak sesuai gender karakter, misal "Lisa" tapi suaranya pria). Teks soal tidak
              diubah — cuma gender diklasifikasi ulang (murah) lalu audionya di-generate ulang
              pakai suara yang sesuai. Aman dijalankan berkali-kali.
            </p>
          </div>
          <button
            onClick={handleFixGender}
            disabled={fixingGender}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition shrink-0"
          >
            {fixingGender ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {fixingGender ? "Memproses..." : "Perbaiki Gender Suara"}
          </button>
        </div>

        {genderCountLoading && !genderProgress && (
          <p className="text-xs text-neutral-400 mt-3">Mengecek jumlah yang perlu diperbaiki...</p>
        )}
        {genderProgress && (
          <p className="text-xs text-neutral-600 mt-3">
            {fixingGender ? (
              <>Diproses {genderProgress.processed} dari {genderProgress.total} soal listening yang butuh perbaikan gender.</>
            ) : genderProgress.total === 0 ? (
              <span className="text-green-700">Semua soal listening sudah punya data gender ✓</span>
            ) : genderProgress.processed >= genderProgress.total ? (
              <span className="text-green-700">
                {genderProgress.processed} soal berhasil diperbaiki ✓
              </span>
            ) : (
              <>{genderProgress.total} soal listening butuh perbaikan gender. Klik tombol di atas untuk mulai.</>
            )}
          </p>
        )}
        {genderErrors.length > 0 && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 max-h-32 overflow-y-auto">
            {genderErrors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
