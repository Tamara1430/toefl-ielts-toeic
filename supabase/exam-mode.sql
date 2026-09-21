-- ============================================================================
-- Mode Ujian: pool soal terpisah (advanced-only, ganti tiap bulan) + tabel
-- hasil ujian. Jalankan SEKALI di SQL Editor.
-- ============================================================================

alter table public.questions
  add column if not exists pool text not null default 'practice' check (pool in ('practice', 'exam')),
  add column if not exists exam_period text;

create index if not exists questions_exam_pool_idx on public.questions (exam, section, exam_period) where pool = 'exam';

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null check (exam in ('toefl', 'ielts', 'toeic')),
  exam_period text not null,
  reading_correct int not null default 0,
  reading_total int not null default 0,
  listening_correct int not null default 0,
  listening_total int not null default 0,
  speaking_score int,
  score_label text not null,
  score_breakdown jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.exam_attempts enable row level security;

create policy "users can read own exam attempts"
  on public.exam_attempts for select
  using (auth.uid() = user_id);

create policy "users can insert own exam attempts"
  on public.exam_attempts for insert
  with check (auth.uid() = user_id);

create policy "admins can read all exam attempts"
  on public.exam_attempts for select
  using (public.is_admin());
