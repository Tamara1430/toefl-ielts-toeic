"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserPlus, Mail } from "lucide-react";

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
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-5">
        <div className="max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <Mail size={26} className="text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Cek email kamu</h1>
          <p className="text-neutral-500 text-sm mb-6">
            Kami sudah kirim link konfirmasi ke <strong>{email}</strong>. Klik link itu untuk
            aktifkan akunmu, lalu login.
          </p>
          <Link href="/login" className="text-sm text-indigo-600 font-medium">
            Ke halaman login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Daftar Gratis</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Langsung coba latihan TOEFL, IELTS, TOEIC — gratis, tanpa kartu kredit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="kamu@email.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-700 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 font-medium transition mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
            Buat Akun Gratis
          </button>
        </form>

        <p className="text-center text-xs text-neutral-400 mt-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-indigo-600 font-medium">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
