"use client";

import { PACKAGES } from "@/lib/entitlements";
import { Check, Sparkles } from "lucide-react";

// GANTI dengan nomor WhatsApp bisnis kamu sendiri sebelum deploy ke production!
// Format: kode negara tanpa "+" atau "0" di depan, contoh Indonesia: 62812xxxxxxx
const WHATSAPP_NUMBER = "6285778435598";

function waLink(packageName: string) {
  const text = encodeURIComponent(`Halo, saya tertarik paket ${packageName}.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export default function BillingPage() {
  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="page-head !pb-4">
        <h1 className="page-head__title">Paket &amp; harga</h1>
        <p className="page-head__desc">
          Latihan selalu gratis dengan kuota terbatas. Upgrade untuk latihan tanpa batas, akses
          Ujian, dan sertifikat hasil skor.
        </p>
      </div>

      <div className="container-page px-5 pt-6">
        {/* Free tier card (current, informational only) */}
        <div className="card p-5 mb-4">
          <p className="text-xs font-medium text-ink-faint mb-1">Paket saat ini</p>
          <h2 className="font-bold text-lg text-ink mb-2">Free</h2>
          <ul className="text-sm text-ink-soft flex flex-col gap-1.5 mb-2">
            <li className="flex items-center gap-2">
              <Check size={14} className="text-ink-faint shrink-0" /> 10 soal Reading per exam
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-ink-faint shrink-0" /> 10 soal Listening per exam
            </li>
            <li className="flex items-center gap-2">
              <Check size={14} className="text-ink-faint shrink-0" /> 3 soal Speaking per exam
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="card p-5 relative"
              style={pkg.recommended ? { borderColor: "var(--gold)", borderWidth: 2 } : undefined}
            >
              {pkg.recommended && (
                <span
                  className="absolute -top-3 left-5 inline-flex items-center gap-1 text-surface text-xs font-medium px-3 py-1 rounded-[5px]"
                  style={{ background: "var(--gold-ink)" }}
                >
                  <Sparkles size={12} /> Paling direkomendasikan
                </span>
              )}
              <h2 className="font-bold text-lg text-ink">{pkg.name}</h2>
              <div className="flex items-baseline gap-2 mt-1 mb-3">
                {pkg.originalPriceLabel && (
                  <span className="text-sm text-ink-faint line-through">
                    {pkg.originalPriceLabel}
                  </span>
                )}
                <span className="stat-num text-xl">{pkg.priceLabel}</span>
              </div>
              <ul className="text-sm text-ink-soft flex flex-col gap-1.5 mb-4">
                {pkg.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-pine shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <a
                href={waLink(pkg.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={`btn w-full sm:w-auto ${pkg.recommended ? "" : "btn-primary"}`}
                style={pkg.recommended ? { background: "var(--gold-ink)", color: "var(--surface)" } : undefined}
              >
                Hubungi via WhatsApp
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-ink-faint mt-8">
          Pembayaran diverifikasi manual oleh admin. Setelah kamu chat &amp; transfer, akunmu akan
          diaktifkan sesuai paket dalam waktu singkat.
        </p>
      </div>
    </main>
  );
}
