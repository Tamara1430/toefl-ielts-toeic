"use client";

import { useEffect, useMemo, useState } from "react";
import { ExamType, SECTION_LABELS, SectionType } from "@/lib/examConfig";
import { getHistory, HistoryRecord } from "@/lib/history";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const SECTION_COLORS: Record<SectionType, string> = {
  reading: "#2f5b46", // pine
  listening: "#b8862e", // gold
  speaking: "#b23a2e", // red
};

function scoreOf(record: HistoryRecord): number | null {
  if (record.section === "speaking") {
    return typeof record.speakingScore === "number" ? record.speakingScore : null;
  }
  if (typeof record.correct === "number" && typeof record.total === "number" && record.total > 0) {
    return Math.round((record.correct / record.total) * 100);
  }
  return null;
}

function trendFor(records: HistoryRecord[]): "up" | "down" | "flat" | null {
  const scored = records.map(scoreOf).filter((v): v is number => v !== null);
  if (scored.length < 2) return null;
  const half = Math.max(1, Math.floor(scored.length / 2));
  const earlier = scored.slice(0, half);
  const later = scored.slice(-half);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const diff = avg(later) - avg(earlier);
  if (diff > 3) return "up";
  if (diff < -3) return "down";
  return "flat";
}

export default function SessionHistory({ exam }: { exam: ExamType }) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getHistory(exam).then((h) => {
      if (!cancelled) {
        setHistory(h);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [exam]);

  const sections: SectionType[] = ["reading", "listening", "speaking"];

  const chartData = useMemo(() => {
    return history
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((r, i) => ({
        index: i + 1,
        date: new Date(r.timestamp).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
        }),
        reading: r.section === "reading" ? scoreOf(r) : undefined,
        listening: r.section === "listening" ? scoreOf(r) : undefined,
        speaking: r.section === "speaking" ? scoreOf(r) : undefined,
      }));
  }, [history]);

  if (!loaded) return null;

  if (history.length === 0) {
    return (
      <div className="rounded-[7px] border border-dashed border-rule-strong p-8 text-center text-ink-faint text-sm">
        Belum ada riwayat latihan. Kerjakan beberapa sesi Reading, Listening, atau Speaking
        dulu — progressmu akan otomatis muncul di sini.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {sections.map((s) => {
          const records = history.filter((h) => h.section === s);
          const scored = records.map(scoreOf).filter((v): v is number => v !== null);
          const avg = scored.length
            ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
            : null;
          const trend = trendFor(records);
          return (
            <div key={s} className="card p-4">
              <p className="text-sm text-ink-soft">{SECTION_LABELS[s]}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="stat-num text-2xl">
                  {avg !== null ? `${avg}%` : "—"}
                </span>
                {trend === "up" && <TrendingUp size={18} className="text-pine" />}
                {trend === "down" && <TrendingDown size={18} className="text-red" />}
                {trend === "flat" && <Minus size={18} className="text-ink-faint" />}
              </div>
              <p className="text-xs text-ink-soft mt-1">
                {records.length} sesi dikerjakan
                {trend === "up" && " • membaik dibanding sesi awal"}
                {trend === "down" && " • menurun dibanding sesi awal"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Progress chart */}
      <div className="card p-4">
        <p className="text-sm font-medium text-ink mb-3">Grafik perkembangan skor (%)</p>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd8c9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#5b6259" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#5b6259" }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="reading"
                name={SECTION_LABELS.reading}
                stroke={SECTION_COLORS.reading}
                connectNulls
                strokeWidth={2}
                dot
              />
              <Line
                type="monotone"
                dataKey="listening"
                name={SECTION_LABELS.listening}
                stroke={SECTION_COLORS.listening}
                connectNulls
                strokeWidth={2}
                dot
              />
              <Line
                type="monotone"
                dataKey="speaking"
                name={SECTION_LABELS.speaking}
                stroke={SECTION_COLORS.speaking}
                connectNulls
                strokeWidth={2}
                dot
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent sessions list */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-ink">Riwayat sesi terbaru</p>
        </div>
        <div className="flex flex-col divide-y divide-[var(--rule)]">
          {history
            .slice()
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20)
            .map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between text-sm gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{SECTION_LABELS[r.section]}</p>
                  <p className="text-ink-faint text-xs truncate">
                    {new Date(r.timestamp).toLocaleString("id-ID")}
                    {r.title ? ` • ${r.title}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="stat-num">
                    {r.section === "speaking" ? `${r.speakingScore}%` : `${r.correct}/${r.total}`}
                  </p>
                  {r.section === "speaking" && r.speakingScale && (
                    <p className="text-xs text-ink-faint max-w-[160px] truncate">
                      {r.speakingScale}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      <p className="text-xs text-ink-faint">
        Riwayat ini tersimpan di akunmu (bukan cuma browser ini), jadi tetap ada walau ganti
        HP atau browser.
      </p>
    </div>
  );
}
