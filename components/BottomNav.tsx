"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, ShieldCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const baseTabs = [
  { href: "/dashboard", label: "Beranda", icon: Home, match: (p: string) => p === "/dashboard" },
  {
    href: "/latihan",
    label: "Latihan",
    icon: Dumbbell,
    match: (p: string) => p.startsWith("/latihan") || p.startsWith("/exam"),
  },
  {
    href: "/progress",
    label: "Progress",
    icon: BarChart3,
    match: (p: string) => p.startsWith("/progress"),
  },
  {
    href: "/profil",
    label: "Profil",
    icon: User,
    match: (p: string) => p.startsWith("/profil"),
  },
];

const adminTab = {
  href: "/admin",
  label: "Admin",
  icon: ShieldCheck,
  match: (p: string) => p.startsWith("/admin"),
};

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAdmin(profile?.role === "admin");
    });
  }, [pathname]);

  // Don't show the nav bar on the public landing/auth pages, or during an
  // active Ujian session — that flow gets its own dedicated top bar
  // (UjianTopBar) instead, so the experience stays distraction-free.
  const isUjianSession = /^\/ujian\/[^/]+$/.test(pathname);
  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || isUjianSession) {
    return null;
  }

  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-rule pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(17,24,39,0.04)]">
      <div
        className="max-w-3xl mx-auto grid"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-2.5 text-xs transition-colors"
            >
              <span
                className={`flex items-center justify-center w-11 h-7 rounded-full transition-colors ${
                  active ? "bg-indigo-tint" : ""
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.3 : 1.9}
                  color={active ? "var(--indigo)" : "var(--ink-faint)"}
                />
              </span>
              <span
                className={active ? "font-semibold" : "font-medium"}
                style={{ color: active ? "var(--indigo)" : "var(--ink-faint)" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
