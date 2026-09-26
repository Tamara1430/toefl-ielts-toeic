"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXAM_LABELS,
  SECTION_LABELS,
  DIFFICULTY_LABELS,
  ExamType,
  SectionType,
  Difficulty,
  GROQ_TEXT_MODEL,
  GROQ_STT_MODEL,
  GROQ_TTS_MODEL,
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
  Gauge,
  Clock,
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

interface GroqUsageRow {
  model: string;
  limit_requests: number | null;
  remaining_requests: number | null;
  reset_requests: string | null;
  limit_tokens: number | null;
  remaining_tokens: number | null;
  reset_tokens: string | null;
  updated_at: string;
}

const GROQ_MODEL_LABELS: Record<string, string> = {
  [GROQ_TEXT_MODEL]: "Teks — generate soal & nilai Speaking",
  [GROQ_STT_MODEL]: "Speech-to-Text — transkrip jawaban Speaking",
  [GROQ_TTS_MODEL]: "Text-to-Speech — audio Listening",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

function UsageBar({
  remaining,
  limit,
}: {
  remaining: number | null;
  limit: number | null;
}) {
  if (remaining === null || limit === null || limit === 0) {
    return <span className="text-ink-faint">—</span>;
  }
  const pct = Math.max(0, Math.min(100, Math.round((remaining / limit) * 100)));
  const color = pct <= 15 ? "bg-red-tint0" : pct <= 40 ? "bg-gold-tint0" : "bg-pine";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-1.5 rounded-[7px] bg-[var(--rule)] overflow-hidden shrink-0">
        <div className={`h-full rounded-[7px] ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-soft tabular-nums">
        {remaining.toLocaleString("id-ID")} / {limit.toLocaleString("id-ID")}
      </span>
    </div>
  );
}

function GroqUsageCard() {
  const [rows, setRows] = useState<GroqUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/groq-usage");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data kuota Groq.");
      setRows(json.rows);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const knownModels = [GROQ_TEXT_MODEL, GROQ_STT_MODEL, GROQ_TTS_MODEL];
  const byModel = new Map(rows.map((r) => [r.model, r]));

  return (
    <div className="rounded-[10px] border border-rule bg-surface p-4">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="flex items-center gap-1.5">
          <Gauge size={15} className="text-ink" />
          <h3 className="font-medium text-ink text-sm">Sisa Kuota Groq</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-[7px] border border-rule bg-surface px-3 py-1.5 text-xs font-medium hover:border-rule-strong transition"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>
      <p className="text-xs text-ink-faint mb-3 max-w-lg">
        Direkam otomatis dari request asli (feedback Speaking, transkrip STT, generate soal &amp;
        suara) — bukan cek terpisah, jadi tidak menambah pemakaian kuota. Pakai ini buat jadwalin
        kapan orang-orang boleh mulai Ujian bareng, biar tidak barengan kena limit.
      </p>

      {error && <p className="text-xs text-red-ink mb-2">{error}</p>}

      <div className="flex flex-col divide-y divide-[var(--rule)]">
        {knownModels.map((model) => {
          const row = byModel.get(model);
          return (
            <div key={model} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between flex-wrap gap-1 mb-1.5">
                <p className="text-sm font-medium text-ink">
                  {GROQ_MODEL_LABELS[model] ?? model}
                </p>
                {row && (
                  <span className="flex items-center gap-1 text-xs text-ink-faint">
                    <Clock size={11} /> {timeAgo(row.updated_at)}
                  </span>
                )}
              </div>
              {!row ? (
                <p className="text-xs text-ink-faint">
                  Belum ada data — belum ada request ke model ini sejak deploy terakhir.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-ink-faint w-20 shrink-0">Requests</span>
                    <UsageBar remaining={row.remaining_requests} limit={row.limit_requests} />
                    {row.reset_requests && (
                      <span className="text-ink-faint ml-1">(reset {row.reset_requests})</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                    <span className="text-ink-faint w-20 shrink-0">Tokens</span>
                    <UsageBar remaining={row.remaining_tokens} limit={row.limit_tokens} />
                    {row.reset_tokens && (
                      <span className="text-ink-faint ml-1">(reset {row.reset_tokens})</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      <span className="inline-flex items-center gap-1.5 text-xs text-ink bg-paper rounded-[7px] px-3 py-1.5">
        <Sparkles size={12} className="animate-pulse" />
        Sedang generate: {EXAM_LABELS[step.exam]} / {SECTION_LABELS[step.section]} /{" "}
        {DIFFICULTY_LABELS[step.difficulty]}
        {step.index && step.total ? ` (${step.index}/${step.total})` : ""}
      </span>
    );
  }
  if (step.questionId) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ink bg-paper rounded-[7px] px-3 py-1.5">
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

  // Exam pool (Ujian mode, monthly rotation)
  const [generatingExamPool, setGeneratingExamPool] = useState(false);
  const [examPoolResult, setExamPoolResult] = useState<string | null>(null);
  const [examPoolError, setExamPoolError] = useState<string | null>(null);
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

  async function handleGenerateExamPool() {
    setGeneratingExamPool(true);
    setExamPoolError(null);
    setExamPoolResult(null);
    try {
      const res = await fetch("/api/admin/generate-exam-pool", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate pool ujian.");
      setExamPoolResult(`${json.totalGenerated} soal ujian baru ditambahkan untuk bulan ini.`);
    } catch (e: any) {
      setExamPoolError(e.message);
    } finally {
      setGeneratingExamPool(false);
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
        <p className="text-sm text-red-ink bg-red-tint border border-red rounded-[7px] p-3">
          {error}
        </p>
      )}

      {/* Sisa Kuota Groq */}
      <GroqUsageCard />

      {/* Stok */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-ink">Stok Bank Soal</h2>
            <p className="text-xs text-ink-faint">
              Auto top-up kalau di bawah {minPoolSize} soal per kombinasi (cron tiap jam). Klik
              baris untuk lihat detail soalnya.
            </p>
          </div>
          <button
            onClick={loadStock}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-[7px] border border-rule bg-surface px-4 py-2 text-sm font-medium hover:border-rule-strong transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="rounded-[10px] border border-rule bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-paper text-left text-ink-soft">
                <th className="px-4 py-2.5 font-medium">Exam</th>
                <th className="px-4 py-2.5 font-medium">Section</th>
                <th className="px-4 py-2.5 font-medium">Kesulitan</th>
                <th className="px-4 py-2.5 font-medium text-right">Stok</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
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
                      className={`cursor-pointer hover:bg-paper transition ${
                        active ? "bg-paper/60" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">{EXAM_LABELS[row.exam]}</td>
                      <td className="px-4 py-2.5">{SECTION_LABELS[row.section]}</td>
                      <td className="px-4 py-2.5">{DIFFICULTY_LABELS[row.difficulty]}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            low ? "text-gold-ink" : "text-ink"
                          }`}
                        >
                          {low && <AlertTriangle size={13} />}
                          {row.count}
                          {active && (
                            <Sparkles size={12} className="text-ink animate-pulse ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="px-2 text-ink-faint">
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                        />
                      </td>
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={5} className="bg-paper px-3 py-2">
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
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-faint">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Umum */}
      <div className="rounded-[10px] border border-rule bg-surface p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-ink text-sm">Generate Umum</h3>
            <p className="text-xs text-ink-faint">
              Cek semua kombinasi, top-up otomatis yang stoknya di bawah ambang batas.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              className="flex items-center gap-1.5 rounded-[7px] bg-ink hover:bg-[#0f1512] disabled:opacity-50 text-surface px-4 py-2 text-sm font-medium transition"
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
                className="flex items-center gap-1 rounded-[7px] border border-red text-red-ink hover:bg-red-tint px-3 py-2 text-sm font-medium transition"
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
        {lastResultAll && <p className="text-xs text-pine mt-3">{lastResultAll}</p>}
      </div>

      {/* Generate Spesifik */}
      <div className="rounded-[10px] border border-rule bg-surface p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Target size={15} className="text-ink" />
          <h3 className="font-medium text-ink text-sm">Generate Spesifik</h3>
        </div>
        <p className="text-xs text-ink-faint mb-3">
          Prioritaskan 1 kombinasi tertentu, tanpa nunggu giliran di "Generate Umum".
        </p>
        <div className="grid sm:grid-cols-4 gap-2 mb-3">
          <select
            value={specExam}
            onChange={(e) => setSpecExam(e.target.value as ExamType)}
            className="rounded-[7px] border border-rule px-2.5 py-2 text-sm"
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
            className="rounded-[7px] border border-rule px-2.5 py-2 text-sm"
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
            className="rounded-[7px] border border-rule px-2.5 py-2 text-sm"
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
            className="rounded-[7px] border border-rule px-2.5 py-2 text-sm"
            placeholder="Jumlah"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateSpecific}
            disabled={generatingSpecific}
            className="flex items-center gap-1.5 rounded-[7px] bg-ink hover:bg-[#0f1512] disabled:opacity-50 text-surface px-4 py-2 text-sm font-medium transition"
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
              className="flex items-center gap-1 rounded-[7px] border border-red text-red-ink hover:bg-red-tint px-3 py-2 text-sm font-medium transition"
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
        {lastResultSpecific && <p className="text-xs text-pine mt-3">{lastResultSpecific}</p>}
      </div>

      {/* Generate Voices */}
      <div className="rounded-[10px] border border-rule bg-surface p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Volume2 size={15} className="text-ink" />
              <h3 className="font-medium text-ink text-sm">Generate Voices</h3>
            </div>
            <p className="text-xs text-ink-faint mt-1 max-w-md">
              Cek semua soal listening yang audionya belum ter-cache (soal lama / gagal saat
              generate), lalu buatkan audionya. Aman dijalankan berkali-kali.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleGenerateVoices}
              disabled={generatingVoices}
              className="flex items-center gap-1.5 rounded-[7px] bg-ink hover:bg-[#0f1512] disabled:opacity-50 text-surface px-4 py-2 text-sm font-medium transition"
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
                className="flex items-center gap-1 rounded-[7px] border border-red text-red-ink hover:bg-red-tint px-3 py-2 text-sm font-medium transition"
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
          <p className="text-xs text-ink-soft mt-3">
            Diproses {voiceProgress.processed} dari {voiceProgress.total} soal listening yang
            butuh audio.
            {!generatingVoices && voiceProgress.total > 0 && voiceProgress.processed === 0 && (
              <span className="text-pine"> Semua soal listening sudah punya audio ✓</span>
            )}
          </p>
        )}
        {voiceErrors.length > 0 && (
          <div className="mt-2 text-xs text-red-ink bg-red-tint border border-red rounded-[7px] p-2 max-h-32 overflow-y-auto">
            {voiceErrors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Fix Gender (migration for old listening questions) */}
      <div className="rounded-[10px] border border-rule bg-surface p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Wand2 size={15} className="text-ink" />
              <h3 className="font-medium text-ink text-sm">Perbaiki Gender Suara</h3>
            </div>
            <p className="text-xs text-ink-faint mt-1 max-w-md">
              Untuk soal listening lama yang dibuat sebelum sistem gender-aware ada (kadang suara
              tidak sesuai gender karakter, misal "Lisa" tapi suaranya pria). Teks soal tidak
              diubah — cuma gender diklasifikasi ulang (murah) lalu audionya di-generate ulang
              pakai suara yang sesuai. Aman dijalankan berkali-kali.
            </p>
          </div>
          <button
            onClick={handleFixGender}
            disabled={fixingGender}
            className="flex items-center gap-1.5 rounded-[7px] bg-ink hover:bg-[#0f1512] disabled:opacity-50 text-surface px-4 py-2 text-sm font-medium transition shrink-0"
          >
            {fixingGender ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
            {fixingGender ? "Memproses..." : "Perbaiki Gender Suara"}
          </button>
        </div>

        {genderCountLoading && !genderProgress && (
          <p className="text-xs text-ink-faint mt-3">Mengecek jumlah yang perlu diperbaiki...</p>
        )}
        {genderProgress && (
          <p className="text-xs text-ink-soft mt-3">
            {fixingGender ? (
              <>Diproses {genderProgress.processed} dari {genderProgress.total} soal listening yang butuh perbaikan gender.</>
            ) : genderProgress.total === 0 ? (
              <span className="text-pine">Semua soal listening sudah punya data gender ✓</span>
            ) : genderProgress.processed >= genderProgress.total ? (
              <span className="text-pine">
                {genderProgress.processed} soal berhasil diperbaiki ✓
              </span>
            ) : (
              <>{genderProgress.total} soal listening butuh perbaikan gender. Klik tombol di atas untuk mulai.</>
            )}
          </p>
        )}
        {genderErrors.length > 0 && (
          <div className="mt-2 text-xs text-red-ink bg-red-tint border border-red rounded-[7px] p-2 max-h-32 overflow-y-auto">
            {genderErrors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Exam Pool (Ujian mode) */}
      <div className="rounded-[10px] border border-rule bg-surface p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-medium text-ink text-sm">Pool Soal Ujian (Bulanan)</h3>
            <p className="text-xs text-ink-faint mt-1 max-w-md">
              Generate/lengkapi soal tingkat Mahir untuk mode Ujian bulan ini. Ini juga jalan
              otomatis tiap bulan lewat cron — tombol ini buat trigger manual (misal pool
              bulan ini belum sempat ter-generate).
            </p>
          </div>
          <button
            onClick={handleGenerateExamPool}
            disabled={generatingExamPool}
            className="flex items-center gap-1.5 rounded-[7px] bg-ink hover:bg-[#0f1512] disabled:opacity-50 text-surface px-4 py-2 text-sm font-medium transition shrink-0"
          >
            {generatingExamPool ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generatingExamPool ? "Generating..." : "Generate Pool Ujian"}
          </button>
        </div>
        {examPoolResult && <p className="text-xs text-pine mt-3">{examPoolResult}</p>}
        {examPoolError && <p className="text-xs text-red-ink mt-3">{examPoolError}</p>}
      </div>
    </div>
  );
}
