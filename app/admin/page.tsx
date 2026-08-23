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
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

interface StockRow {
  exam: ExamType;
  section: SectionType;
  difficulty: Difficulty;
  count: number;
}

export default function AdminStockPage() {
  const [stock, setStock] = useState<StockRow[]>([]);
  const [minPoolSize, setMinPoolSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

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

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/generate", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal generate.");
      setLastResult(`${json.totalGenerated} soal baru ditambahkan.`);
      await loadStock();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-neutral-900">Stok Bank Soal</h2>
          <p className="text-xs text-neutral-400">
            Otomatis di-top-up kalau di bawah {minPoolSize} soal per kombinasi (via cron tiap
            jam). Bisa juga trigger manual di bawah.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStock}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:border-neutral-400 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium transition"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? "Generating..." : "Generate Sekarang"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}
      {lastResult && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          {lastResult}
        </p>
      )}

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
  );
}
