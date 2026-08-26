# Exam AI — TOEFL, IELTS, TOEIC (multi-user, bank soal, login)

Webapp latihan **TOEFL, IELTS, dan TOEIC** dengan AI (Groq), sekarang dengan:

- **Login multi-user** (5-10 akun, dikelola manual oleh admin — tanpa payment gateway)
- **Bank soal di database** (bukan generate on-demand tiap klik) — hemat biaya Groq jangka panjang
- **Anti-repetisi**: tiap user dapat soal acak yang belum pernah dia lihat, urutan pilihan jawaban diacak ulang
- **Auto top-up bank soal** tiap jam via `pg_cron` (gratis di Supabase), hanya generate secukupnya kalau stok menipis
- **Admin panel**: kelola user (aktif/nonaktif, tanggal bayar), lihat stok soal, generate manual
- **Interface "stok habis"** yang ramah kalau bank soal untuk kombinasi tertentu kosong
- Dashboard, gamifikasi (streak/level/badge), progress — semua tersimpan per akun di database (bukan localStorage lagi)

Dibangun dengan **Next.js 16** + **Supabase** (Postgres + Auth + Cron) + **Groq API**, siap deploy ke **Vercel**.

---

## Arsitektur singkat

```
User login (Supabase Auth)
        │
        ▼
Ambil soal acak belum pernah dilihat dari bank (Supabase Postgres)
        │
        ├─ stok ada → tampilkan soal
        └─ stok habis → pesan maaf + saran coba mode/kesulitan lain

Admin panel ─┐
             ├─→ generate manual (tombol) ─┐
pg_cron ─────┘  tiap jam, cek stok         ├─→ Groq AI → simpan ke bank soal
                tiap kombinasi,             │   (hanya kalau stok < ambang batas)
                top-up jika perlu ──────────┘
```

TTS (suara), STT (rekam & transkrip jawaban), dan feedback AI untuk speaking **tetap real-time** seperti sebelumnya — itu memang harus terjadi saat itu juga karena melibatkan suara asli tiap user, jadi tidak bisa "di-bank".

---

## ⚠️ Soal kredensial (JANGAN sampai bocor)

Ada 3 jenis kredensial di app ini, jangan sampai tertukar taruh-nya:

| Kredensial | Boleh di frontend? | Taruh di mana |
|---|---|---|
| `GROQ_API_KEY` | ❌ Tidak | `.env.local` / Vercel env var saja |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Boleh (memang didesain publik, dibatasi RLS) | `.env.local` / Vercel env var |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **JANGAN PERNAH** — ini bisa bypass semua proteksi database | `.env.local` / Vercel env var saja |
| `CRON_SECRET` | ❌ Tidak | `.env.local` / Vercel env var + dipakai lagi di setup `pg_cron` |

Semua ini otomatis aman dari ke-commit ke Git karena `.gitignore` sudah meng-ignore `.env*`.

---

## 1. Setup Supabase (database + login)

1. Buat akun & project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor** → New query → paste seluruh isi file `supabase/schema.sql` → **Run**.
   Ini membuat semua tabel (`profiles`, `questions`, `user_seen_questions`, `practice_sessions`), proteksi RLS, dan trigger otomatis bikin profil user baru.
3. Buka **SQL Editor** lagi (New query, JANGAN pakai tab yang sama dengan langkah 2) → paste isi `supabase/storage.sql` → **Run**. Ini bikin storage bucket `tts-audio` untuk cache audio listening.
4. Buka **SQL Editor** lagi (New query baru lagi) → paste isi `supabase/jobs.sql` → **Run**. Ini bikin tabel yang dipakai tombol "Batalkan" & live progress di admin panel untuk generate soal/voices.
   - Kalau kamu sudah pernah menjalankan `jobs.sql` versi lama (sebelum ada live progress), jalankan juga `supabase/jobs-update.sql` sekali untuk menambahkan kolom yang kurang.
3. Buka **Authentication → Users → Add user**. Buat akun pertamamu (email + password) — ini akan jadi admin.
4. Balik ke **SQL Editor**, jalankan (ganti email-nya):
   ```sql
   update public.profiles
   set role = 'admin', is_active = true
   where email = 'emailkamu@contoh.com';
   ```
5. Buka **Project Settings → API**, catat 3 nilai ini untuk langkah berikutnya:
   - `Project URL` → jadi `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → jadi `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → jadi `SUPABASE_SERVICE_ROLE_KEY` (klik "reveal" dulu)

## 2. Setup Lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan API key Groq kamu + 3 nilai Supabase di atas + `CRON_SECRET` bebas (string acak panjang).

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) → login pakai akun admin yang dibuat di langkah 1.3.

## 3. Push ke GitHub & Deploy ke Vercel

```bash
git init
git add .
git commit -m "Initial commit: Exam AI multi-user"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

Di [vercel.com](https://vercel.com) → **Add New Project** → import repo → di bagian **Environment Variables**, isi semua variabel yang ada di `.env.local` kamu (GROQ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET) → **Deploy**.

Catat URL production-nya (misal `https://exam-ai-app.vercel.app`).

## 4. Setup Auto-Generate (pg_cron)

1. Buka `supabase/cron.sql`, ganti `<URL-VERCEL-KAMU>` dan `<CRON_SECRET>` sesuai punyamu.
2. Paste ke **SQL Editor** Supabase → **Run**.
3. Cek jadwalnya jalan dengan query (ada di komentar file yang sama):
   ```sql
   select * from cron.job;
   select jobname, status, return_message, start_time
   from cron.job_run_details order by start_time desc limit 10;
   ```

Defaultnya jadwal **tiap jam** (`0 * * * *`). Bisa diubah ke tiap 3 jam (`0 */3 * * *`) dkk kalau mau makin hemat — edit lalu `select cron.unschedule('top-up-question-bank');` dulu sebelum jadwal ulang dengan skedul baru.

## 5. Tambah User Berbayar

Login sebagai admin → menu **Admin** (otomatis kelihatan kalau role kamu admin) → tab **Kelola User** → **Tambah User** → isi email + password sementara + (opsional) tanggal "bayar sampai". Akun langsung aktif begitu dibuat.

User itu tinggal login pakai email + password yang kamu buatkan. Sarankan mereka ganti password sendiri nanti (fitur ganti password belum ada di v1 ini — lihat bagian "Pengembangan Lanjutan").

Untuk **menonaktifkan** user (misal telat bayar), tinggal klik badge "Aktif" di baris user itu supaya jadi "Nonaktif" — mereka akan diarahkan ke halaman "akun belum aktif" saat coba login.

---

## Cache Audio Listening (biar hemat token)

Sebelumnya audio TTS listening dibuat **live setiap kali** ada yang klik play — kalau 50 user dengar soal yang sama, Groq TTS kepanggil 50x untuk audio yang identik. Sekarang:

- Saat soal listening baru digenerate (manual atau via cron), audionya **langsung dibuat sekali dan disimpan** ke Supabase Storage (bucket `tts-audio`). URL-nya ditempel ke data soal.
- User yang play soal itu, siapa pun dan berapa kali pun, tinggal load audio yang sudah ada — tidak trigger Groq TTS lagi.
- Kalau ada soal listening lama (dibuat sebelum fitur ini ada) atau audionya gagal ke-generate karena suatu error, tinggal klik **"Generate Voices"** di admin panel — ini scan semua soal listening yang audionya belum lengkap, lalu bikinkan yang kurang. Aman diklik berkali-kali (soal yang sudah lengkap otomatis di-skip).

## Generate Umum vs Generate Spesifik

Di halaman `/admin`, sekarang ada 2 cara trigger generate soal manual:

- **Generate Umum** — cek semua 27 kombinasi (3 exam × 3 section × 3 kesulitan), top-up otomatis yang stoknya di bawah ambang batas. Ini juga yang dijalankan `pg_cron` tiap jam.
- **Generate Spesifik** — pilih 1 kombinasi tertentu + jumlah soal, langsung generate tanpa peduli ambang batas. Cocok kalau kamu mau prioritaskan (misal "saya butuh 10 soal TOEFL Speaking Advanced sekarang juga buat sesi user besok pagi").

## Tombol Batalkan (Cancel)

Ketiga aksi generate manual (Generate Umum, Generate Spesifik, Generate Voices) punya tombol **Batalkan** yang muncul selama proses berjalan. Cara kerjanya:

- Soal/audio yang **sedang diproses saat itu juga** (satu panggilan AI yang sedang berjalan) selalu dibiarkan selesai dulu dan tersimpan normal — tidak pernah ada data setengah jadi/rusak yang ke-save.
- Begitu kamu klik Batalkan, **tidak ada item baru** yang mulai diproses setelah itu.
- Jadi kalau kamu generate 20 soal lalu batalkan di soal ke-8, hasilnya: 8 soal (yang sudah selesai) tersimpan rapi, 12 sisanya tidak diproses sama sekali — bukan soal ke-9 yang "terpotong".

Mekanismenya pakai tabel `generation_jobs` di database sebagai penanda status (`running`/`cancelled`/`completed`), dicek oleh server di antara tiap item sebelum lanjut ke item berikutnya.

## Live Progress — pantau soal mana yang sedang digenerate

Selama Generate Umum/Spesifik/Voices berjalan, admin panel menampilkan:

- **Badge live** di atas tombol, contoh: "Sedang generate: TOEFL / Reading / Menengah (2/4)" untuk soal, atau "Sedang generate suara: [judul] — Woman (giliran 3/6)" untuk audio.
- **Baris tabel stok** yang sedang diproses ikut ditandai (ikon berkedip + background biru muda).
- **Klik baris mana pun** di tabel stok untuk buka daftar soal di kombinasi itu — tiap soal listening menampilkan status audio-nya (misal "4/6 audio" berwarna kuning kalau belum lengkap, hijau kalau sudah semua), dan soal yang **sedang diproses saat itu juga** ditandai badge "sedang diproses".

Cara kerja: server update kolom `current_step` di tabel `generation_jobs` sesaat sebelum mulai memproses tiap item, client polling status itu tiap 1.5 detik selama proses berjalan.

## Kontrol biaya bank soal

Diatur di `lib/questionGeneration.ts`:

```ts
export const MIN_POOL_SIZE = 60;  // top-up otomatis sampai target ini tercapai per kombinasi
export const TOP_UP_BATCH = 20;   // maksimal nambah berapa soal per run top-up
```

**Tidak ada batas maksimal stok per kombinasi** — pool cuma akan bertambah kalau stoknya di bawah `MIN_POOL_SIZE`. Target dinaikkan ke 60 (dari 12 sebelumnya) supaya kamu punya buffer lebih tebal, mengingat Groq free tier punya limit harian — dengan stok lebih besar, kamu tidak gampang kehabisan soal di antara waktu reset kuota harian.

**Deteksi rate limit otomatis**: kalau Groq mengembalikan error rate limit/kuota (kode 429 atau pesan sejenis) di tengah proses generate, sistem langsung berhenti dengan rapi (bukan lanjut coba 26 kombinasi lain yang pasti gagal juga) dan kasih tahu di hasilnya: *"⚠️ Berhenti karena kelihatannya kena rate limit/kuota harian Groq"*. Tinggal coba lagi nanti/besok setelah kuota reset.

Kalau suatu saat mau tetap ada batas atas (misalnya biar tidak kebablasan kalau ada bug generate berulang), tinggal tambahkan lagi pengecekan `MAX_POOL_SIZE` di 2 fungsi (`topUpAllPools` dan `topUpOne`) di file yang sama.

---

## Model Groq yang dipakai

- **Generate soal & feedback speaking**: `openai/gpt-oss-120b`
- **Speech-to-Text**: `whisper-large-v3-turbo`
- **Text-to-Speech**: `canopylabs/orpheus-v1-english`

Groq cukup sering mempensiunkan model lama — kalau muncul error `model_not_found`/`model_decommissioned`, cek [console.groq.com/docs/models](https://console.groq.com/docs/models) dan ganti string model di `lib/examConfig.ts`.

---

## Struktur Proyek

```
supabase/
  schema.sql                    → skema database lengkap (jalankan sekali di awal)
  storage.sql                   → setup bucket audio TTS (jalankan sekali di awal)
  jobs.sql                      → tabel kontrol batalkan generate (jalankan sekali di awal)
  jobs-update.sql               → tambahan kolom live progress (hanya kalau sudah pernah run jobs.sql versi lama)
  cron.sql                      → setup pg_cron auto top-up (jalankan setelah deploy)
middleware.ts                   → proteksi route: wajib login, cek akun aktif, cek admin
app/
  page.tsx                      → Dashboard: level/XP, streak, stats, badge
  login/page.tsx                → halaman login
  pending/page.tsx              → tampil kalau akun belum diaktifkan admin
  latihan/page.tsx               → menu pilih exam
  progress/page.tsx              → progress gabungan lintas exam
  admin/                         → admin panel: stok soal, generate umum/spesifik/voices, kelola user
  exam/[exam]/ExamPractice.tsx   → UI latihan, ambil soal dari bank + UI "stok habis"
  api/admin/                     → endpoint admin (stok, generate manual/spesifik/voices, kelola user)
  api/cron/generate/route.ts     → endpoint dipanggil pg_cron, auto top-up bank soal
  api/practice/question/route.ts → ambil 1 soal acak belum pernah dilihat user
  api/practice/complete/route.ts → catat hasil sesi ke practice_sessions
  api/tts, api/stt, api/feedback → tetap real-time (suara asli user, fallback TTS soal lama)
components/
  BottomNav.tsx, McqQuestions.tsx, DialoguePlayer.tsx, AudioRecorder.tsx,
  SpeakingSession.tsx, SessionHistory.tsx, LogoutButton.tsx, AdminQuestionList.tsx
lib/
  supabase/client.ts, server.ts, admin.ts  → 3 jenis Supabase client (browser/server/service-role)
  serverAuth.ts                  → helper requireAdmin() / requireUser() untuk API routes
  questionGeneration.ts          → logika generate + top-up (umum & spesifik), dipakai admin & cron
  audioGeneration.ts             → generate + cache audio TTS listening ke Supabase Storage
  generationJobs.ts              → kontrol job cancellable (dipakai tombol Batalkan)
  shuffleQuestion.ts             → acak urutan pilihan jawaban MCQ
  history.ts                     → baca/tulis riwayat sesi (sekarang dari Supabase)
  gamification.ts                → hitung streak, XP/level, badge
  examConfig.ts, groqClient.ts   → konfigurasi exam & Groq (sama seperti sebelumnya)
```

---

## Prioritas Soal Listening (audio siap dulu)

Saat user ambil soal listening, sistem sekarang **memprioritaskan soal yang audionya sudah lengkap ter-cache DAN belum pernah dikerjakan user itu**. Soal yang audionya masih bolong (belum sempat digenerate/backfill) tidak pernah disodorkan ke user — daripada dengar suara yang error/kepotong.

Kalau ternyata SEMUA soal yang tersisa untuk user itu audionya belum siap, muncul alert khusus: *"Soal ada, tapi audionya belum siap 🎧 — tunggu sebentar lalu coba lagi"*. Ini beda dari alert "stok soal habis" biasa — di sini soalnya sebenarnya ada, cuma admin perlu generate audionya dulu (pakai tombol Generate Voices atau Generate per-soal di `/admin`).

## Progres User (buat planning)

Di `/admin/users`, sekarang ada:
- **Ringkasan total** — jumlah soal yang sudah dikerjakan semua user gabungan, di bagian atas halaman.
- **Per-user** — total soal dikerjakan + breakdown Reading/Listening/Speaking + tanggal terakhir aktif, ditampilkan di bawah tiap baris user.

## Pengembangan Lanjutan (belum termasuk di v1 ini)

- **Ganti password sendiri** oleh user (sekarang admin yang set password awal)
- **Payment gateway otomatis** (Midtrans/Xendit) — sekarang manual oleh admin sesuai permintaanmu
- **Auto-nonaktifkan** user yang `paid_until` sudah lewat (sekarang murni field informatif, belum ada logic otomatis mematikan akses)
