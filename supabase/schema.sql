-- ============================================================================
-- Exam AI — Supabase schema
-- Jalankan seluruh file ini di Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- ---------- profiles ----------
-- Satu baris per akun, dibuat otomatis saat user baru muncul di auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default false,
  paid_until date,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Helper: cek apakah user yang sedang login adalah admin (dipakai policy lain).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- Auto-create profile row setiap kali ada user baru di auth.users.
-- Default role='user', is_active=false — admin yang mengaktifkan manual dari panel.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------- questions (bank soal) ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam text not null check (exam in ('toefl', 'ielts', 'toeic')),
  section text not null check (section in ('reading', 'listening', 'speaking')),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists questions_pool_idx on public.questions (exam, section, difficulty);

alter table public.questions enable row level security;

-- Semua user yang login (aktif ataupun belum, dicek lagi di app layer) boleh baca soal.
-- Insert/update/delete HANYA lewat service role key (dipakai backend admin/cron), jadi tidak perlu policy insert/update/delete di sini.
create policy "authenticated users can read questions"
  on public.questions for select
  using (auth.role() = 'authenticated');


-- ---------- user_seen_questions (anti-repetisi) ----------
create table if not exists public.user_seen_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.user_seen_questions enable row level security;

create policy "users can read own seen list"
  on public.user_seen_questions for select
  using (auth.uid() = user_id);

create policy "users can insert own seen record"
  on public.user_seen_questions for insert
  with check (auth.uid() = user_id);


-- ---------- practice_sessions (riwayat & progress) ----------
create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null check (exam in ('toefl', 'ielts', 'toeic')),
  section text not null check (section in ('reading', 'listening', 'speaking')),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  question_id uuid references public.questions(id) on delete set null,
  title text,
  correct int,
  total int,
  speaking_score int,
  speaking_scale text,
  created_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_idx on public.practice_sessions (user_id, created_at desc);

alter table public.practice_sessions enable row level security;

create policy "users can read own sessions"
  on public.practice_sessions for select
  using (auth.uid() = user_id);

create policy "users can insert own sessions"
  on public.practice_sessions for insert
  with check (auth.uid() = user_id);


-- ============================================================================
-- SETELAH menjalankan file ini:
-- 1. Buka Authentication → Users → Add user, buat akun pertamamu (email + password).
-- 2. Jalankan query di bawah (ganti email-nya) untuk menjadikan akun itu admin & aktif:
--
--    update public.profiles
--    set role = 'admin', is_active = true
--    where email = 'emailkamu@contoh.com';
--
-- 3. Login ke webapp pakai akun itu → otomatis punya akses ke /admin.
-- ============================================================================
