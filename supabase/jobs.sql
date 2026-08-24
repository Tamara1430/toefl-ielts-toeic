-- ============================================================================
-- Tabel untuk kontrol batal/cancel proses generate — jalankan SEKALI di SQL
-- Editor. File TERPISAH dari schema.sql, tidak perlu jalankan ulang schema.sql.
-- ============================================================================

create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('questions', 'voices')),
  status text not null default 'running' check (status in ('running', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generation_jobs enable row level security;

-- Hanya admin yang boleh lihat/ubah (dipakai dari admin panel).
drop policy if exists "admins can manage generation jobs" on public.generation_jobs;
create policy "admins can manage generation jobs"
  on public.generation_jobs for all
  using (public.is_admin())
  with check (public.is_admin());
