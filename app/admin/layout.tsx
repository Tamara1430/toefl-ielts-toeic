"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { Home } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin", label: "Stok Soal", match: (p: string) => p === "/admin" },
    { href: "/admin/users", label: "Kelola User", match: (p: string) => p.startsWith("/admin/users") },
  ];

  return (
    <main className="min-h-screen bg-paper pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-bold text-2xl text-ink">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-ink-faint hover:text-ink transition-colors">
              <Home size={18} />
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-ink-soft text-sm mb-6">Kelola bank soal dan akses user.</p>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 rounded-[7px] text-sm font-medium transition-colors border ${
                t.match(pathname)
                  ? "bg-ink text-surface border-ink"
                  : "bg-surface text-ink-soft border-rule-strong hover:border-ink"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </main>
  );
}
