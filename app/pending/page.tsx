import { Clock } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-5">
      <div className="max-w-sm text-center card p-8">
        <div className="w-12 h-12 rounded-[8px] bg-gold-tint border border-gold flex items-center justify-center mx-auto mb-4">
          <Clock size={22} className="text-gold-ink" />
        </div>
        <h1 className="font-bold text-xl text-ink mb-2">Akun belum aktif</h1>
        <p className="text-ink-soft text-sm mb-6">
          Akunmu sudah terdaftar tapi belum diaktifkan oleh admin. Biasanya ini karena
          pembayaran belum dikonfirmasi. Hubungi admin untuk aktivasi.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
