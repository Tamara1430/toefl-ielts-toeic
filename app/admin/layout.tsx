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
    <main className="min-h-screen bg-neutral-50 pb-24">
      <div className="max-w-3xl mx-auto px-5 pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-neutral-900">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-neutral-400 hover:text-neutral-700">
              <Home size={18} />
            </Link>
            <LogoutButton />
          </div>
        </div>
        <p className="text-neutral-500 text-sm mb-6">Kelola bank soal dan akses user.</p>

        <div className="flex gap-2 mb-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                t.match(pathname)
                  ? "bg-neutral-900 text-white border-neutral-900"
                  : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400"
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
