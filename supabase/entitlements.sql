-- ============================================================================
-- Entitlements: akses berbayar per-exam — jalankan SEKALI di SQL Editor.
-- ============================================================================

alter table public.profiles
  add column if not exists entitlements jsonb not null default '{}'::jsonb;

-- Bentuk data entitlements (contoh):
-- {} artinya semua exam masih di free tier (default user baru)
-- { "toefl": "premium" } artinya user itu Premium TOEFL (latihan unlimited + ujian + sertifikat)
-- { "ielts": "ujian" } artinya user itu cuma beli paket Ujian IELTS saja (latihan tetap kena kuota free)
-- { "toefl": "premium", "ielts": "premium", "toeic": "premium" } artinya user itu Ultimate

-- Tidak perlu constraint check ketat di level DB supaya fleksibel kalau nanti
-- ada tier baru — validasi nilai dilakukan di aplikasi (lib/entitlements.ts).
