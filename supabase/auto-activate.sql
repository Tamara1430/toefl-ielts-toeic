-- ============================================================================
-- Update: akun baru langsung aktif (free tier tidak butuh verifikasi
-- pembayaran) — jalankan SEKALI di SQL Editor. is_active sekarang murni jadi
-- "saklar admin" buat blokir akun (misal ada yang curang), bukan gerbang
-- wajib sebelum bisa pakai fitur gratis.
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_active)
  values (new.id, new.email, true);
  return new;
end;
$$;

-- Opsional: kalau ada akun lama yang masih is_active=false dan bukan karena
-- sengaja diblokir admin, kamu bisa aktifkan massal dengan:
-- update public.profiles set is_active = true where role = 'user';
