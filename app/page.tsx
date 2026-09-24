import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Headphones,
  Mic,
  Flame,
  Trophy,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  CheckCircle2,
  Infinity as InfinityIcon,
} from "lucide-react";

export const metadata = {
  title: "Exam AI — Latihan TOEFL, IELTS, TOEIC dengan AI",
  description:
    "Latihan Reading, Listening, dan Speaking untuk TOEFL, IELTS, dan TOEIC dengan feedback AI instan. Mulai gratis, tanpa kartu kredit.",
};

const exams = [
  { name: "TOEFL iBT", tagline: "Reading akademik, Listening kuliah, Speaking terpadu" },
  { name: "IELTS Academic", tagline: "3 bagian Speaking, Reading & Listening gaya IELTS" },
  { name: "TOEIC", tagline: "Simulasi dunia kerja: email, memo, percakapan kantor" },
];

const features = [
  {
    icon: BookOpenCheck,
    title: "Reading dari bank soal AI",
    desc: "Ribuan soal reading bergaya asli tiap exam, selalu acak dan anti-repetisi — kamu tidak akan diberi soal yang sama dua kali.",
  },
  {
    icon: Headphones,
    title: "Listening dengan suara natural",
    desc: "Audio dialog & monolog dibuat dengan text-to-speech AI yang menyesuaikan suara pria/wanita sesuai karakter — bukan cuma robot datar.",
  },
  {
    icon: Mic,
    title: "Speaking + feedback AI instan",
    desc: "Rekam jawabanmu, sistem transkrip otomatis (speech-to-text) lalu AI langsung menilai dan kasih masukan, seperti dilatih tutor pribadi.",
  },
  {
    icon: Flame,
    title: "Streak, XP, level & badge",
    desc: "Latihan tiap hari, kumpulkan XP, naik level, dan buka pencapaian — belajar bahasa Inggris jadi terasa seperti main game, bukan beban.",
  },
  {
    icon: BadgeCheck,
    title: "Mode Ujian + sertifikat",
    desc: "Simulasikan suasana ujian sesungguhnya, dapatkan estimasi skor dalam skala resmi (TOEFL 0-90+, IELTS band 0-9, TOEIC 10-990) plus sertifikat hasil.",
  },
  {
    icon: ShieldCheck,
    title: "Progress tersimpan aman",
    desc: "Semua riwayat, skor, dan pencapaianmu tersimpan di akun — bisa dipantau kapan saja lewat dashboard progress pribadimu.",
  },
];

const steps = [
  {
    n: "1",
    title: "Daftar gratis",
    desc: "Buat akun dalam hitungan detik. Tanpa kartu kredit, tanpa komitmen.",
  },
  {
    n: "2",
    title: "Pilih exam & skill",
    desc: "TOEFL, IELTS, atau TOEIC — fokus latihan Reading, Listening, atau Speaking.",
  },
  {
    n: "3",
    title: "Latihan & naik level",
    desc: "Dapat feedback AI instan tiap sesi, kumpulkan streak, dan lihat skormu naik.",
  },
];

const plans = [
  {
    name: "Free",
    price: "Rp0",
    period: "selamanya",
    desc: "Coba dulu, tanpa risiko.",
    features: [
      "10 soal Reading per exam",
      "10 soal Listening per exam",
      "3 soal Speaking per exam",
      "Gamifikasi & dashboard progress",
    ],
    cta: "Mulai Gratis",
    highlight: false,
  },
  {
    name: "Premium",
    price: "Rp40.000",
    period: "/bulan / exam",
    desc: "Latihan tanpa batas untuk 1 exam pilihanmu.",
    features: [
      "Latihan tanpa batas, semua bank soal",
      "Akses mode Ujian",
      "Sertifikat hasil skor",
    ],
    cta: "Pilih Premium",
    highlight: false,
  },
  {
    name: "Ultimate",
    price: "Rp100.000",
    period: "/bulan",
    original: "Rp150.000",
    desc: "Semua exam, semua fitur, tanpa batas.",
    features: [
      "Premium TOEFL + IELTS + TOEIC sekaligus",
      "Latihan tanpa batas ketiganya",
      "Akses & sertifikat Ujian ketiganya",
    ],
    cta: "Pilih Ultimate",
    highlight: true,
  },
];

const faqs = [
  {
    q: "Apakah ini benar-benar gratis?",
    a: "Ya. Akun Free bisa langsung latihan Reading, Listening, dan Speaking tanpa kartu kredit. Kalau butuh latihan tanpa batas atau mau ambil sesi Ujian bersertifikat, tinggal upgrade kapan saja.",
  },
  {
    q: "Apakah sertifikat dari mode Ujian resmi dari ETS/IDP/British Council?",
    a: "Bukan. Skor dan sertifikat di sini adalah estimasi dari simulasi latihan berbasis AI, bukan skor resmi dari lembaga penyelenggara TOEFL/IELTS/TOEIC. Ini alat latihan, bukan pengganti tes resmi.",
  },
  {
    q: "Bagaimana AI menilai jawaban Speaking saya?",
    a: "Jawabanmu direkam, ditranskripsi otomatis, lalu dinilai AI berdasarkan konten, kelancaran, dan tata bahasa — hasilnya langsung muncul beberapa detik setelah kamu selesai bicara.",
  },
  {
    q: "Bagaimana cara upgrade paket?",
    a: "Setelah daftar, buka halaman Paket di dalam akunmu dan hubungi admin lewat WhatsApp untuk aktivasi — prosesnya cepat dan manual, tanpa gateway pembayaran yang ribet.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-500" />
            <span className="font-bold text-neutral-900 tracking-tight">Exam AI</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 px-3 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full px-4 py-2 transition"
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-900 to-violet-900 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
        <div className="relative max-w-6xl mx-auto px-5 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium mb-6">
            <Sparkles size={14} className="text-amber-300" />
            Ditenagai AI — bukan sekadar bank soal statis
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            Skor TOEFL, IELTS, dan TOEIC impianmu, dilatih dengan AI setiap hari
          </h1>
          <p className="mt-5 text-indigo-100/90 text-base sm:text-lg max-w-xl mx-auto">
            Reading, Listening, dan Speaking dengan feedback AI instan. Latihan jadi
            kebiasaan lewat streak, level, dan badge — bukan tugas yang menumpuk.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white text-indigo-900 font-semibold px-6 py-3 text-sm hover:bg-indigo-50 transition shadow-lg shadow-black/10 w-full sm:w-auto justify-center"
            >
              Mulai Sekarang, Gratis <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white font-medium px-6 py-3 text-sm hover:bg-white/10 transition w-full sm:w-auto justify-center"
            >
              Sudah punya akun? Masuk
            </Link>
          </div>
          <p className="mt-4 text-xs text-indigo-200/70">
            Tanpa kartu kredit · Langsung bisa latihan dalam 1 menit
          </p>
        </div>

        {/* Exam chips */}
        <div className="relative max-w-4xl mx-auto px-5 pb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exams.map((e) => (
              <div
                key={e.name}
                className="rounded-xl bg-white/10 border border-white/15 px-4 py-3 backdrop-blur-sm"
              >
                <p className="font-semibold text-sm">{e.name}</p>
                <p className="text-xs text-indigo-100/70 mt-1">{e.tagline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">
            Kenapa latihan di sini
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            Semua yang kamu butuh untuk naikkan skor, dalam satu tempat
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-200 p-6 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <f.icon size={20} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification banner */}
      <section className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-amber-600 text-sm font-semibold uppercase tracking-wide">
              Bukan cuma latihan, tapi kebiasaan
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2 mb-4">
              Bikin belajar bahasa Inggris nagih, bukan menyiksa
            </h2>
            <p className="text-neutral-500 mb-6">
              Setiap sesi latihan yang kamu selesaikan memberi XP. Kumpulkan XP untuk
              naik level, jaga streak harianmu tetap menyala, dan buka badge pencapaian
              satu per satu — progresmu terlihat jelas, bukan cuma angka skor.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-neutral-700">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                Streak harian yang memotivasi kamu latihan tiap hari
              </li>
              <li className="flex items-start gap-2.5 text-sm text-neutral-700">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                Level & XP dari tiap sesi latihan yang kamu selesaikan
              </li>
              <li className="flex items-start gap-2.5 text-sm text-neutral-700">
                <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                Badge pencapaian yang bisa kamu kumpulkan dan pamerkan
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-neutral-700">Level 7</span>
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1">
                <Flame size={14} className="text-orange-500" />
                <span className="text-xs font-semibold text-orange-600">12 hari</span>
              </div>
            </div>
            <div className="h-2.5 rounded-full bg-neutral-100 overflow-hidden mb-6">
              <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
                <Trophy size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium leading-tight">Konsisten 7 Hari</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Streak seminggu penuh</p>
                </div>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
                <Trophy size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium leading-tight">Speaker Pemula</p>
                  <p className="text-xs text-neutral-500 mt-0.5">10 sesi Speaking selesai</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">
            Gampang mulainya
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
            3 langkah, langsung latihan
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="text-center sm:text-left">
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 mx-auto sm:mx-0">
                {s.n}
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1.5">{s.title}</h3>
              <p className="text-sm text-neutral-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-neutral-50 border-y border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
          <div className="text-center max-w-xl mx-auto mb-12">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wide">
              Paket
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
              Mulai gratis, upgrade kalau butuh lebih
            </h2>
            <p className="text-neutral-500 mt-3">
              Tidak ada paksaan langganan di awal — coba dulu, baru putuskan.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 flex flex-col ${
                  p.highlight
                    ? "bg-indigo-950 text-white ring-2 ring-indigo-600 relative"
                    : "bg-white border border-neutral-200"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-indigo-950 text-xs font-bold px-3 py-1 rounded-full">
                    Paling Hemat
                  </span>
                )}
                <h3 className={`font-semibold ${p.highlight ? "text-white" : "text-neutral-900"}`}>
                  {p.name}
                </h3>
                <div className="mt-2 mb-1 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-2xl font-bold">{p.price}</span>
                  <span className={`text-xs ${p.highlight ? "text-indigo-200" : "text-neutral-400"}`}>
                    {p.period}
                  </span>
                  {p.original && (
                    <span className="text-xs line-through text-indigo-300">{p.original}</span>
                  )}
                </div>
                <p className={`text-xs mb-5 ${p.highlight ? "text-indigo-200" : "text-neutral-500"}`}>
                  {p.desc}
                </p>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={16}
                        className={`shrink-0 mt-0.5 ${
                          p.highlight ? "text-amber-300" : "text-indigo-600"
                        }`}
                      />
                      <span className={p.highlight ? "text-indigo-50" : "text-neutral-700"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`text-center rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    p.highlight
                      ? "bg-white text-indigo-900 hover:bg-indigo-50"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-neutral-400 mt-6 flex items-center justify-center gap-1.5">
            <InfinityIcon size={14} /> Upgrade paket dilakukan manual lewat admin, aman dan cepat
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-5 py-16 sm:py-24">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Pertanyaan yang sering ditanyakan
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-neutral-200 p-4 sm:p-5 open:bg-neutral-50"
            >
              <summary className="font-medium text-neutral-900 cursor-pointer list-none flex items-center justify-between gap-4">
                {f.q}
                <span className="text-neutral-400 group-open:rotate-45 transition shrink-0">+</span>
              </summary>
              <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-b from-indigo-950 to-violet-900 text-white">
        <div className="max-w-3xl mx-auto px-5 py-16 sm:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Siap lihat seberapa jauh skormu bisa naik?
          </h2>
          <p className="text-indigo-100/80 mb-8">
            Daftar gratis sekarang, kerjakan sesi pertamamu hari ini juga.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-white text-indigo-900 font-semibold px-7 py-3.5 text-sm hover:bg-indigo-50 transition"
          >
            Mulai Sekarang, Gratis <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-violet-500" />
            <span className="text-sm font-semibold text-neutral-700">Exam AI</span>
          </div>
          <p className="text-xs text-neutral-400 text-center">
            Skor Ujian di aplikasi ini adalah estimasi dari simulasi latihan, bukan skor
            resmi ETS/IDP/British Council.
          </p>
        </div>
      </footer>
    </main>
  );
}
