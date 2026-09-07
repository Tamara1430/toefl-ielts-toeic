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

## Storage: kenapa soal tidak perlu dihapus, dan tetap muat di free tier

Supabase free tier: **500MB database** (teks soal) + **1GB file storage** (audio) + 5GB bandwidth/bulan.

**Teks soal praktis tidak jadi masalah** — bank soal penuh (27 kombinasi × target 150 soal = ~4.050 baris) cuma sekitar belasan MB saja dari kuota 500MB. Soal-soal ini memang didesain untuk **tidak pernah dihapus** — begitu ada, tetap tersedia buat user baru mana pun, tidak ada logic auto-cleanup yang perlu kamu khawatirkan.

**Audio itu yang berat**, dan di situ ada 1 perbaikan penting: sebelumnya audio disimpan format **WAV** (tidak dikompres, ~384KB per giliran bicara). Sekarang diganti ke **MP3** (~64KB per giliran, kualitas suara tetap bagus untuk telinga manusia) — irit sampai ~6x. Dengan format ini, bank listening penuh (9 kombinasi × 150 soal × ~7 giliran ≈ 9.450 giliran bicara) diperkirakan makan **~600MB dari kuota 1GB** — masih ada sisa ruang, tapi sudah lebih mepet dari sebelumnya. Kalau nanti kamu mau naikkan `MIN_POOL_SIZE` lagi, cek dulu sisa storage di Supabase Dashboard → Storage sebelum menaikkan terlalu jauh.

> Catatan: audio yang **sudah** ter-generate sebelum perubahan ini (format WAV) tetap ada apa adanya, tidak otomatis dikonversi ulang — cuma audio **baru** ke depannya yang pakai MP3. Ini aman, tidak perlu tindakan apa pun dari kamu; storage-nya cuma makin lambat bertambah dari sekarang.

## Kontrol biaya bank soal & realita limit harian Groq

Diatur di `lib/questionGeneration.ts`:

```ts
export const MIN_POOL_SIZE = 150; // target stok per kombinasi (dibatasi kapasitas storage 1GB Supabase, lihat bagian Storage di atas)
export const TOP_UP_BATCH = 5;    // maksimal nambah berapa soal per run top-up, per kombinasi
```

**Limit resmi Groq free tier untuk `openai/gpt-oss-120b`** (dicek Agustus 2026): 30 request/menit, 1.000 request/hari, 8.000 token/menit, **200.000 token/hari**. Yang paling ketat itu **token per hari**, bukan jumlah request — karena tiap generate soal makan ~1.000-2.000 token, realistisnya cuma sekitar **~100-130 kali generate soal per hari total**, gabungan dari SEMUA 27 kombinasi (3 exam × 3 section × 3 kesulitan).

Konsekuensinya:
- **Membangun stok dari nol sampai 150/kombinasi butuh waktu ~5-7 minggu**, bukan sekali jalan — ini wajar untuk free tier, bukan bug. Cron tetap jalan di background tiap jam, kamu tidak perlu lakukan apa-apa selain sabar menunggu.
- Kalau kena limit harian di tengah proses, sistem berhenti rapi (fitur rate-limit detection) dan kasih tahu di hasilnya — tinggal nunggu reset besok, cron otomatis lanjut lagi.
- **Urutan kombinasi diacak tiap kali run** — supaya kalau limit harian kena di tengah jalan, bukan selalu kombinasi yang sama (misal TOEFL selalu menang, TOEIC selalu buntung) yang dapat jatah tiap hari.
- Kalau butuh cepat untuk kombinasi tertentu, pakai **Generate Spesifik** di admin panel — tidak perlu nunggu giliran top-up otomatis.

Kalau kamu upgrade ke Groq berbayar nanti, limit-nya naik signifikan — tinggal naikkan lagi `TOP_UP_BATCH` di file yang sama supaya lebih cepat penuh.

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
proxy.ts                        → proteksi route: wajib login, cek akun aktif, cek admin
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
  fixGender.ts                    → migrasi: klasifikasi gender + regenerate audio soal lama
  ttsProvider.ts                 → fallback Groq Orpheus → Edge TTS kalau Groq gagal
  generationJobs.ts              → kontrol job cancellable (dipakai tombol Batalkan)
  shuffleQuestion.ts             → acak urutan pilihan jawaban MCQ
  history.ts                     → baca/tulis riwayat sesi (sekarang dari Supabase)
  gamification.ts                → hitung streak, XP/level, badge
  examConfig.ts, groqClient.ts   → konfigurasi exam & Groq (sama seperti sebelumnya)
```

---

## Suara Sesuai Gender Karakter

Sebelumnya pemilihan suara TTS murni berdasarkan **urutan siapa yang ngomong duluan** dalam dialog — jadi karakter bernama "Lisa" bisa saja kebagian suara laki-laki kalau kebetulan bukan yang pertama bicara. Sekarang diperbaiki: saat generate soal, AI diminta secara eksplisit menentukan gender tiap karakter (`"gender": "male" | "female"` per giliran bicara di data soal), dan sistem pilih suara dari pool **khusus gender itu** — "Lisa" selalu dapat suara wanita, "Man" selalu dapat suara laki-laki, tidak peduli urutan bicaranya.

**Soal listening yang sudah lebih dulu ada** (dibuat sebelum perbaikan ini) tidak punya data gender. Ada tombol **"Perbaiki Gender Suara"** di `/admin` untuk memperbaikinya tanpa membuang soal yang sudah ada:

- Teks soal & pertanyaan **tidak diubah sama sekali** — cuma AI diminta klasifikasi gender tiap nama karakter (panggilan super murah, ~150 token, jauh lebih hemat dari generate ulang soal ~1.500 token).
- Audio lama yang mungkin salah otomatis di-generate ulang pakai suara yang sesuai gender yang baru diklasifikasi.
- Aman diklik berkali-kali — soal yang sudah punya data gender otomatis di-skip.

## TTS Fallback: Groq Orpheus → Edge TTS (gratis tanpa limit)

Groq Orpheus TTS (suara AI, ekspresif) tetap jadi **prioritas utama**. Tapi karena free tier Orpheus cuma 100 request/hari (gampang habis untuk banyak soal listening × banyak giliran bicara), sekarang ada **fallback otomatis**: kalau Groq TTS gagal karena alasan apa pun (rate limit, kuota habis, dll), sistem langsung coba **Edge TTS** — layanan text-to-speech gratis tanpa API key/kartu kredit/rate limit resmi, memakai suara Microsoft Neural (kualitas natural, setara Azure TTS berbayar).

Beberapa hal penting soal ini:
- Berlaku di **semua jalur TTS**: generate soal baru, backfill "Generate Voices", generate per-soal, dan fallback live untuk soal lama yang belum ter-cache.
- Tiap giliran bicara yang berhasil dibuat lewat Edge TTS ditandai di data soal (`ttsProvider: "edge"`), dan admin panel menampilkan label kecil **"(sebagian via Edge TTS)"** di daftar soal kalau ada giliran yang pakai fallback ini — supaya kamu tahu kualitas suaranya mungkin bukan Orpheus penuh.
- **Catatan jujur**: Edge TTS ini bukan API resmi yang didokumentasikan Microsoft untuk pihak ketiga — ini wrapper open-source dari fitur "Read Aloud" Edge browser, dipakai luas di komunitas tapi tidak ada jaminan resmi stabil selamanya. Karena cuma dipakai sebagai *fallback* (bukan utama), risiko ini kecil dampaknya — kalau Edge TTS suatu saat berhenti berfungsi, soal-soal yang sudah pakai Orpheus tetap aman, dan generate baru tinggal balik mengandalkan Groq saja sampai ada solusi lain.

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
