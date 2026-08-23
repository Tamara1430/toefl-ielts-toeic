import { MergedHistoryRecord } from "./history";

export function scoreOf(record: MergedHistoryRecord): number | null {
  if (record.section === "speaking") {
    return typeof record.speakingScore === "number" ? record.speakingScore : null;
  }
  if (
    typeof record.correct === "number" &&
    typeof record.total === "number" &&
    record.total > 0
  ) {
    return Math.round((record.correct / record.total) * 100);
  }
  return null;
}

/** Consecutive days (ending today or yesterday) with at least one completed session. */
export function computeStreak(records: MergedHistoryRecord[]): number {
  if (records.length === 0) return 0;
  const days = new Set(records.map((r) => new Date(r.timestamp).toDateString()));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function sessionsToday(records: MergedHistoryRecord[]): number {
  const today = new Date().toDateString();
  return records.filter((r) => new Date(r.timestamp).toDateString() === today).length;
}

export function sessionsThisWeek(records: MergedHistoryRecord[]): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return records.filter((r) => now - r.timestamp <= weekMs).length;
}

export function averageScore(records: MergedHistoryRecord[]): number | null {
  const scored = records.map(scoreOf).filter((v): v is number => v !== null);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
}

export function computeXP(records: MergedHistoryRecord[]): number {
  return records.reduce((sum, r) => sum + (scoreOf(r) ?? 0), 0);
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

/** Simple escalating level curve: each level requires progressively more XP. */
export function computeLevel(xp: number): LevelInfo {
  let level = 1;
  let threshold = 200;
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level++;
    threshold = Math.round(threshold * 1.25);
  }
  return { level, xpIntoLevel: remaining, xpForNextLevel: threshold };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
}

export function computeBadges(records: MergedHistoryRecord[]): Badge[] {
  const totalSessions = records.length;
  const readingCount = records.filter((r) => r.section === "reading").length;
  const listeningCount = records.filter((r) => r.section === "listening").length;
  const speakingCount = records.filter((r) => r.section === "speaking").length;
  const streak = computeStreak(records);
  const highScores = records.filter((r) => (scoreOf(r) ?? 0) >= 90).length;
  const examsTried = new Set(records.map((r) => r.exam)).size;

  return [
    {
      id: "first-session",
      label: "Langkah Pertama",
      description: "Selesaikan sesi latihan pertamamu",
      achieved: totalSessions >= 1,
    },
    {
      id: "streak-3",
      label: "Konsisten 3 Hari",
      description: "Latihan 3 hari berturut-turut",
      achieved: streak >= 3,
    },
    {
      id: "streak-7",
      label: "Seminggu Penuh",
      description: "Latihan 7 hari berturut-turut",
      achieved: streak >= 7,
    },
    {
      id: "reading-5",
      label: "Kutu Buku",
      description: "Selesaikan 5 sesi Reading",
      achieved: readingCount >= 5,
    },
    {
      id: "listening-5",
      label: "Telinga Tajam",
      description: "Selesaikan 5 sesi Listening",
      achieved: listeningCount >= 5,
    },
    {
      id: "speaking-5",
      label: "Percaya Diri",
      description: "Selesaikan 5 sesi Speaking",
      achieved: speakingCount >= 5,
    },
    {
      id: "high-score",
      label: "Nyaris Sempurna",
      description: "Raih skor 90%+ dalam satu sesi",
      achieved: highScores >= 1,
    },
    {
      id: "all-rounder",
      label: "Serba Bisa",
      description: "Coba latihan di TOEFL, IELTS, dan TOEIC",
      achieved: examsTried >= 3,
    },
  ];
}
