import { Clock } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

export default function PendingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-5">
      <div className="max-w-sm text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <Clock size={26} className="text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-neutral-900 mb-2">Akun belum aktif</h1>
        <p className="text-neutral-500 text-sm mb-6">
          Akunmu sudah terdaftar tapi belum diaktifkan oleh admin. Biasanya ini karena
          pembayaran belum dikonfirmasi. Hubungi admin untuk aktivasi.
        </p>
        <LogoutButton />
      </div>
    </main>
  );
}
