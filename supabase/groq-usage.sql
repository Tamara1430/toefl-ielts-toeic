-- ============================================================================
-- Groq rate-limit snapshot: dipakai buat panel admin "Sisa Kuota Groq".
-- Jalankan SEKALI di SQL Editor.
--
-- Datanya BUKAN dari ping/cek terpisah ke Groq (yang malah makan kuota),
-- tapi direkam otomatis dari header `x-ratelimit-*` yang Groq selalu balas
-- di setiap request asli (feedback speaking, transkrip STT, generate soal,
-- generate suara). Jadi tabel ini cuma nyimpen snapshot TERAKHIR per model.
-- ============================================================================

create table if not exists public.groq_rate_limits (
  model text primary key,
  limit_requests int,
  remaining_requests int,
  reset_requests text,
  limit_tokens int,
  remaining_tokens int,
  reset_tokens text,
  updated_at timestamptz not null default now()
);

alter table public.groq_rate_limits enable row level security;

-- Cuma admin yang boleh baca. Insert/update HANYA lewat service role key
-- (dipakai backend saat mencatat header dari tiap request Groq), jadi tidak
-- perlu policy insert/update di sini.
create policy "admins can read groq rate limits"
  on public.groq_rate_limits for select
  using (public.is_admin());
