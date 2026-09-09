"use client";

import { PACKAGES } from "@/lib/entitlements";
import { Check, Sparkles } from "lucide-react";

// GANTI dengan nomor WhatsApp bisnis kamu sendiri sebelum deploy ke production!
// Format: kode negara tanpa "+" atau "0" di depan, contoh Indonesia: 62812xxxxxxx
const WHATSAPP_NUMBER = "6281234567890";

function waLink(packageName: string) {
  const text = encodeURIComponent(`Halo, saya tertarik paket ${packageName}.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-1">Paket & Harga</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Latihan selalu gratis dengan kuota terbatas. Upgrade untuk latihan tanpa batas, akses
          Ujian, dan sertifikat hasil skor.
        </p>

        {/* Free tier card (current, informational only) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 mb-4">
          <p className="text-xs font-medium text-neutral-400 mb-1">PAKET SAAT INI</p>
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Free</h2>
          <ul className="text-sm text-neutral-600 flex flex-col gap-1.5 mb-2">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-neutral-400 shrink-0" /> 10 soal Reading per exam
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-neutral-400 shrink-0" /> 10 soal Listening per exam
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-neutral-400 shrink-0" /> 3 soal Speaking per exam
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`rounded-2xl border p-5 relative ${
                pkg.recommended
                  ? "border-indigo-400 bg-indigo-50/50 shadow-sm"
                  : "border-neutral-200 bg-white"
              }`}
            >
              {pkg.recommended && (
                <span className="absolute -top-3 left-5 inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  <Sparkles size={12} /> Paling Direkomendasikan
                </span>
              )}
              <h2 className="text-lg font-semibold text-neutral-900">{pkg.name}</h2>
              <div className="flex items-baseline gap-2 mt-1 mb-3">
                {pkg.originalPriceLabel && (
                  <span className="text-sm text-neutral-400 line-through">
                    {pkg.originalPriceLabel}
                  </span>
                )}
                <span className="text-xl font-bold text-neutral-900">{pkg.priceLabel}</span>
              </div>
              <ul className="text-sm text-neutral-600 flex flex-col gap-1.5 mb-4">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-green-600 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink(pkg.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition w-full sm:w-auto ${
                  pkg.recommended
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                    : "bg-neutral-900 hover:bg-neutral-800 text-white"
                }`}
              >
                Hubungi via WhatsApp
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-8">
          Pembayaran diverifikasi manual oleh admin. Setelah kamu chat & transfer, akunmu akan
          diaktifkan sesuai paket dalam waktu singkat.
        </p>
      </div>
    </main>
  );
}
