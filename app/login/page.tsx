"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email atau password salah."
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-7 h-7 rounded-[4px] bg-ink flex items-center justify-center">
            <span className="text-surface text-xs font-mono font-semibold">EA</span>
          </div>
          <span className="font-bold text-lg text-ink">Exam AI</span>
        </div>

        <div className="card p-7">
          <h1 className="font-bold text-xl text-ink mb-1">Masuk ke akunmu</h1>
          <p className="text-sm text-ink-soft mb-6">Lanjutkan latihan dari titik terakhirmu.</p>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-ink bg-red-tint border border-red rounded-[7px] p-3">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary mt-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              Masuk
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-6">
          Belum punya akun?{" "}
          <Link href="/signup" className="text-ink font-medium underline underline-offset-2">
            Daftar gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
