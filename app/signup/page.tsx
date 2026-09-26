"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, Mail } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(
        error.message.includes("already registered") ? "Email ini sudah terdaftar." : error.message
      );
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNeedsEmailConfirm(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (needsEmailConfirm) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper px-5">
        <div className="max-w-sm text-center card p-8">
          <div className="w-12 h-12 rounded-[8px] bg-gold-tint border border-gold flex items-center justify-center mx-auto mb-4">
            <Mail size={22} className="text-gold-ink" />
          </div>
          <h1 className="font-serif text-xl text-ink mb-2">Cek email kamu</h1>
          <p className="text-ink-soft text-sm mb-6">
            Kami sudah kirim link konfirmasi ke <strong className="text-ink">{email}</strong>. Klik
            link itu untuk aktifkan akunmu, lalu login.
          </p>
          <Link href="/login" className="text-sm text-ink font-medium underline underline-offset-2">
            Ke halaman login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-7 h-7 rounded-[4px] bg-ink flex items-center justify-center">
            <span className="text-surface text-xs font-mono font-semibold">EA</span>
          </div>
          <span className="font-serif text-lg text-ink">Exam AI</span>
        </div>

        <div className="card p-7">
          <h1 className="font-serif text-xl text-ink mb-1">Daftar gratis</h1>
          <p className="text-sm text-ink-soft mb-6">
            Langsung coba latihan TOEFL, IELTS, TOEIC — tanpa kartu kredit.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="kamu@email.com"
              />
            </div>
            <div>
              <label className="field-label">Kata sandi</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="Minimal 6 karakter"
              />
            </div>

            {error && (
              <p className="text-sm text-red-ink bg-red-tint border border-red rounded-[7px] p-3">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Buat akun gratis
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-ink font-medium underline underline-offset-2">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
