"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, BarChart3 } from "lucide-react";

const tabs = [
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-3xl mx-auto grid grid-cols-3">
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
