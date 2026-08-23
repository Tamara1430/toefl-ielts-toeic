import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Exam AI — TOEFL, IELTS, TOEIC",
  description:
    "Belajar TOEFL, IELTS, dan TOEIC dengan AI: Reading, Listening (TTS), dan Speaking (STT) — lengkap dengan dashboard progress.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-neutral-50">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
