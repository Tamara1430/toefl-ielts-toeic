"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, GraduationCap, BarChart3, ShieldCheck, User } from "lucide-react";
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
    href: "/ujian",
    label: "Ujian",
    icon: GraduationCap,
    match: (p: string) => p.startsWith("/ujian"),
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
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.match(pathname))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] px-3 pointer-events-none">
      <div
        className="max-w-md mx-auto relative grid rounded-[26px] bg-surface/90 backdrop-blur-md border border-rule pointer-events-auto"
        style={{
          gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))`,
          boxShadow: "0 12px 32px rgba(17,24,39,0.10), 0 2px 8px rgba(17,24,39,0.05)",
        }}
      >
        {/* Sliding active indicator */}
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-2xl bg-indigo-tint transition-all duration-300 ease-out"
          style={{
            width: `calc(${100 / tabs.length}% - 8px)`,
            left: `calc(${(100 / tabs.length) * activeIndex}% + 4px)`,
          }}
        />

        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="relative z-10 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-transform active:scale-90"
            >
              <Icon
                size={19}
                strokeWidth={active ? 2.4 : 1.9}
                className="transition-transform duration-300"
                style={{
                  color: active ? "var(--indigo)" : "var(--ink-faint)",
                  transform: active ? "translateY(-1px) scale(1.05)" : "none",
                }}
              />
              <span
                className={`transition-colors duration-200 ${active ? "font-semibold" : "font-medium"}`}
                style={{ color: active ? "var(--indigo)" : "var(--ink-faint)", fontSize: "10.5px" }}
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
