import type { Metadata, Viewport } from "next";
import { Source_Serif_4, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exam AI — TOEFL, IELTS, TOEIC",
  description:
    "Belajar TOEFL, IELTS, dan TOEIC dengan AI: Reading, Listening (TTS), dan Speaking (STT) — lengkap dengan dashboard progress.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f1efe7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`h-full antialiased ${sourceSerif.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full flex flex-col font-sans bg-paper text-ink">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
