-- ============================================================================
-- Tambahan kolom untuk live progress tracking — jalankan SEKALI di SQL Editor.
-- Ini untuk yang SUDAH menjalankan supabase/jobs.sql sebelumnya (nambah 1
-- kolom baru ke tabel yang sudah ada, aman & tidak menghapus data apa pun).
-- ============================================================================

alter table public.generation_jobs
  add column if not exists current_step jsonb;
