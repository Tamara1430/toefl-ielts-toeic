-- ============================================================================
-- Storage bucket untuk cache audio TTS listening — jalankan SEKALI di SQL Editor.
-- Ini FILE TERPISAH dari schema.sql, tidak perlu jalankan ulang schema.sql.
-- ============================================================================

-- Bikin bucket publik (audio boleh diakses siapa saja yang punya link-nya,
-- tapi hanya backend/service_role yang boleh upload/hapus).
insert into storage.buckets (id, name, public)
values ('tts-audio', 'tts-audio', true)
on conflict (id) do nothing;

-- Izinkan siapa saja membaca file di bucket ini (dibutuhkan supaya <audio> di
-- browser user bisa load file-nya).
drop policy if exists "Public read tts-audio" on storage.objects;
create policy "Public read tts-audio"
  on storage.objects for select
  using (bucket_id = 'tts-audio');

-- Tidak perlu policy insert/update/delete untuk role lain — upload HANYA
-- dilakukan lewat service_role key di backend, yang otomatis bypass RLS.
