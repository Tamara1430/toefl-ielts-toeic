"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const baseTabs = [
  { href: "/", label: "Beranda", icon: Home, match: (p: string) => p === "/" },
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

  // Don't show the nav bar at all on the login page.
  if (pathname === "/login") return null;

  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
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
              className={`flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                active ? "text-indigo-600" : "text-neutral-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
