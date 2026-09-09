import { ExamType, SectionType } from "@/lib/examConfig";

export type EntitlementLevel = "free" | "ujian" | "premium";

export type Entitlements = Partial<Record<ExamType, "ujian" | "premium">>;

export function getEntitlement(entitlements: Entitlements | null | undefined, exam: ExamType): EntitlementLevel {
  return entitlements?.[exam] ?? "free";
}

export function hasUnlimitedLatihan(level: EntitlementLevel): boolean {
  return level === "premium";
}

export function canAccessUjian(level: EntitlementLevel): boolean {
  return level === "ujian" || level === "premium";
}

/**
 * Free-tier lifetime quota per exam, per section. Deliberately small and
 * FIXED — every free account (including new ones created purely to dodge
 * this limit) draws from the exact same small pool of oldest questions (see
 * getFreeTierQuestionIds in lib/practiceQuestions.ts), so creating a new
 * account gets you nothing new to solve. Once you've done all of them,
 * you've done all of them — no reason to keep making accounts.
 */
export const FREE_TIER_LIMITS: Record<SectionType, number> = {
  reading: 10,
  listening: 10,
  speaking: 3,
};

export interface PackageDef {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  originalPriceLabel?: string;
  exam?: ExamType;
  tier: "ujian" | "premium" | "ultimate";
  features: string[];
  recommended?: boolean;
}

export const PACKAGES: PackageDef[] = [
  {
    id: "ujian-toefl",
    name: "Ujian TOEFL",
    price: 20000,
    priceLabel: "Rp20.000",
    exam: "toefl",
    tier: "ujian",
    features: ["1x sesi Ujian TOEFL", "Sertifikat hasil skor TOEFL", "Soal ujian diganti tiap bulan"],
  },
  {
    id: "ujian-ielts",
    name: "Ujian IELTS",
    price: 20000,
    priceLabel: "Rp20.000",
    exam: "ielts",
    tier: "ujian",
    features: ["1x sesi Ujian IELTS", "Sertifikat hasil skor IELTS", "Soal ujian diganti tiap bulan"],
  },
  {
    id: "ujian-toeic",
    name: "Ujian TOEIC",
    price: 20000,
    priceLabel: "Rp20.000",
    exam: "toeic",
    tier: "ujian",
    features: ["1x sesi Ujian TOEIC", "Sertifikat hasil skor TOEIC", "Soal ujian diganti tiap bulan"],
  },
  {
    id: "premium-toefl",
    name: "Premium TOEFL",
    price: 40000,
    priceLabel: "Rp40.000/bulan",
    exam: "toefl",
    tier: "premium",
    features: ["Latihan TOEFL tanpa batas", "Akses Ujian TOEFL", "Sertifikat hasil skor TOEFL"],
  },
  {
    id: "premium-ielts",
    name: "Premium IELTS",
    price: 40000,
    priceLabel: "Rp40.000/bulan",
    exam: "ielts",
    tier: "premium",
    features: ["Latihan IELTS tanpa batas", "Akses Ujian IELTS", "Sertifikat hasil skor IELTS"],
  },
  {
    id: "premium-toeic",
    name: "Premium TOEIC",
    price: 40000,
    priceLabel: "Rp40.000/bulan",
    exam: "toeic",
    tier: "premium",
    features: ["Latihan TOEIC tanpa batas", "Akses Ujian TOEIC", "Sertifikat hasil skor TOEIC"],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 100000,
    priceLabel: "Rp100.000/bulan",
    originalPriceLabel: "Rp150.000",
    tier: "ultimate",
    recommended: true,
    features: [
      "Semua fitur Premium TOEFL + IELTS + TOEIC",
      "Latihan tanpa batas ketiganya",
      "Akses Ujian ketiganya",
      "Sertifikat ketiga skor",
    ],
  },
];
