import { ExamType } from "@/lib/examConfig";

export interface ScoreBreakdownItem {
  label: string;
  value: string;
}

export interface CertificateScore {
  examLabel: string;
  primary: string;
  breakdown: ScoreBreakdownItem[];
  note: string;
}

function pctToToeflSection(pct: number): number {
  return Math.round((pct / 100) * 30);
}

function pctToIeltsBand(pct: number): number {
  const raw = (pct / 100) * 9;
  return Math.round(raw * 2) / 2; // nearest 0.5
}

function pctToToeicScaled(pct: number): number {
  return Math.round(5 + (pct / 100) * 490); // 5-495 range
}

/**
 * All scores here are ESTIMATES derived from a practice simulation — never
 * real official scores from ETS/IDP/British Council/etc. This is enforced by
 * always labeling exam names as "(Simulasi)" and including an explicit
 * disclaimer, so the certificate can never be mistaken for an official
 * result.
 */
export function computeCertificateScore(
  exam: ExamType,
  readingPct: number,
  listeningPct: number,
  speakingPct: number
): CertificateScore {
  if (exam === "toefl") {
    const r = pctToToeflSection(readingPct);
    const l = pctToToeflSection(listeningPct);
    const s = pctToToeflSection(speakingPct);
    const total = r + l + s;
    return {
      examLabel: "TOEFL iBT (Simulasi)",
      primary: `${total} / 90`,
      breakdown: [
        { label: "Reading", value: `${r} / 30` },
        { label: "Listening", value: `${l} / 30` },
        { label: "Speaking", value: `${s} / 30` },
      ],
      note: "Estimasi dari simulasi latihan — BUKAN skor resmi ETS. Section Writing tidak diujikan di versi ini.",
    };
  }

  if (exam === "ielts") {
    const r = pctToIeltsBand(readingPct);
    const l = pctToIeltsBand(listeningPct);
    const s = pctToIeltsBand(speakingPct);
    const overall = Math.round(((r + l + s) / 3) * 2) / 2;
    return {
      examLabel: "IELTS (Simulasi)",
      primary: `Band ${overall.toFixed(1)}`,
      breakdown: [
        { label: "Reading", value: `Band ${r.toFixed(1)}` },
        { label: "Listening", value: `Band ${l.toFixed(1)}` },
        { label: "Speaking", value: `Band ${s.toFixed(1)}` },
      ],
      note: "Estimasi dari simulasi latihan — BUKAN skor resmi IELTS/British Council/IDP. Section Writing tidak diujikan di versi ini.",
    };
  }

  const l = pctToToeicScaled(listeningPct);
  const r = pctToToeicScaled(readingPct);
  const s = Math.round((speakingPct / 100) * 200);
  const total = l + r;
  return {
    examLabel: "TOEIC (Simulasi)",
    primary: `${total} / 990`,
    breakdown: [
      { label: "Listening", value: `${l} / 495` },
      { label: "Reading", value: `${r} / 495` },
      { label: "Speaking", value: `${s} / 200` },
    ],
    note: "Estimasi dari simulasi latihan — BUKAN skor resmi ETS TOEIC.",
  };
}
