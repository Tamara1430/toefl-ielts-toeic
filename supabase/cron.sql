-- ============================================================================
-- Auto-generate soal (top-up bank) — jalankan file ini SETELAH webapp sudah
-- live di Vercel (butuh URL production-nya).
-- ============================================================================

-- 1. Aktifkan extension yang dibutuhkan (aman dijalankan berkali-kali).
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2. Jadwalkan pemanggilan endpoint /api/cron/generate tiap jam.
--    GANTI:
--      <URL-VERCEL-KAMU>  → contoh: https://exam-ai-app.vercel.app
--      <CRON_SECRET>      → nilai yang sama persis dengan env var CRON_SECRET di Vercel
--
--    Skedul '0 * * * *' = tiap jam, menit ke-0 (contoh: 08:00, 09:00, ...).
--    Ganti sesuai kebutuhan, misalnya '0 */3 * * *' untuk tiap 3 jam agar makin hemat.
select cron.schedule(
  'top-up-question-bank',
  '0 * * * *',
  $$
  select net.http_post(
    url := '<URL-VERCEL-KAMU>/api/cron/generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Cek jadwal yang aktif:
-- select * from cron.job;

-- Cek riwayat eksekusi (berhasil/gagal):
-- select jobname, status, return_message, start_time
-- from cron.job_run_details
-- order by start_time desc
-- limit 10;

-- Untuk menghapus/menghentikan jadwal ini:
-- select cron.unschedule('top-up-question-bank');
