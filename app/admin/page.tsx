"use client";

import { useEffect, useState } from "react";
import {
  EXAM_LABELS,
  SECTION_LABELS,
  DIFFICULTY_LABELS,
  ExamType,
  SectionType,
  Difficulty,
} from "@/lib/examConfig";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Volume2, Target } from "lucide-react";

interface StockRow {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  count: number;
}

const exams: ExamType[] = ["toefl", "ielts", "toeic"];
const sections: SectionType[] = ["reading", "listening", "speaking"];
const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];

export default function AdminStockPage() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [minPoolSize, setMinPoolSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate umum (top-up semua kombinasi yang stoknya menipis)
  const [generatingAll, setGeneratingAll] = useState(false);
  const [lastResultAll, setLastResultAll] = useState<string | null>(null);

  // Generate spesifik (1 kombinasi, jumlah bebas)
  const [specExam, setSpecExam] = useState<ExamType>("toefl");
  const [specSection, setSpecSection] = useState<SectionType>("reading");
  const [specDifficulty, setSpecDifficulty] = useState<Difficulty>("intermediate");
  const [specCount, setSpecCount] = useState(5);
  const [generatingSpecific, setGeneratingSpecific] = useState(false);
  const [lastResultSpecific, setLastResultSpecific] = useState<string | null>(null);

  // Generate voices (backfill audio listening yang belum ke-cache)
  const [generatingVoices, setGeneratingVoices] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState<{ processed: number; total: number } | null>(
    null
  );
  const [voiceErrors, setVoiceErrors] = useState<string[]>([]);

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

  useEffect(() => {
    loadStock();
  }, []);

  async function handleGenerateAll() {
    setGeneratingAll(true);
    setError(null);
    setLastResultAll(null);
    try {
      const res = await fetch("/api/admin/generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate.");
      setLastResultAll(`${json.totalGenerated} soal baru ditambahkan.`);
      await loadStock();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingAll(false);
    }
  }

  async function handleGenerateSpecific() {
    setGeneratingSpecific(true);
    setError(null);
    setLastResultSpecific(null);
    try {
      const res = await fetch("/api/admin/generate-specific", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam: specExam,
          section: specSection,
          difficulty: specDifficulty,
          count: specCount,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate.");
      const r = json.result;
      setLastResultSpecific(
        `${r.generated} soal baru untuk ${EXAM_LABELS[specExam]} / ${SECTION_LABELS[specSection]} / ${DIFFICULTY_LABELS[specDifficulty]}${
          r.errors.length ? ` (${r.errors.length} gagal)` : ""
        }.`
      );
      await loadStock();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingSpecific(false);
    }
  }

  async function handleGenerateVoices() {
    setGeneratingVoices(true);
    setError(null);
    setVoiceErrors([]);
    setVoiceProgress(null);

    let totalProcessed = 0;
    let remaining = 1; // dummy, biar loop pertama jalan

    try {
      while (remaining > 0) {
        const res = await fetch("/api/admin/generate-voices", { method: "POST" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Gagal generate voices.");

        totalProcessed += json.processed;
        remaining = json.remaining;
        setVoiceProgress({ processed: totalProcessed, total: totalProcessed + remaining });
        if (json.errors?.length) setVoiceErrors((prev) => [...prev, ...json.errors]);

        if (json.processed === 0 && remaining > 0) break; // safety: hindari infinite loop
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGeneratingVoices(false);
    }
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
              Auto top-up kalau di bawah {minPoolSize} soal per kombinasi (cron tiap jam).
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
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {stock.map((row, i) => {
                const low = row.count < minPoolSize;
                return (
                  <tr key={i}>
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
                      </span>
                    </td>
                  </tr>
                );
              })}
              {stock.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
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
          <button
            onClick={handleGenerateAll}
            disabled={generatingAll}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition shrink-0"
          >
            {generatingAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generatingAll ? "Generating..." : "Generate Umum"}
          </button>
        </div>
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
          <button
            onClick={handleGenerateVoices}
            disabled={generatingVoices}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition shrink-0"
          >
            {generatingVoices ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Volume2 size={14} />
            )}
            {generatingVoices ? "Memproses..." : "Generate Voices"}
          </button>
        </div>

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
    </div>
  );
}
