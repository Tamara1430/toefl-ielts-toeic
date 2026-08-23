"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus, Trash2, ShieldCheck } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: "user" | "admin";
  is_active: boolean;
  paid_until: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [paidUntil, setPaidUntil] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat user.");
      setUsers(json.users);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, paidUntil: paidUntil || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat user.");
      setEmail("");
      setPassword("");
      setPaidUntil("");
      setShowForm(false);
      await loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user: UserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (res.ok) loadUsers();
  }

  async function updatePaidUntil(user: UserRow, value: string) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid_until: value || null }),
    });
    loadUsers();
  }

  async function handleDelete(user: UserRow) {
    if (!confirm(`Hapus akun ${user.email}? Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    if (res.ok) loadUsers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-neutral-900">Daftar User</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition"
        >
          <UserPlus size={15} /> Tambah User
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-neutral-200 bg-white p-4 mb-5 flex flex-col gap-3"
        >
          <p className="text-xs text-neutral-500">
            Buat akun untuk user yang pembayarannya sudah kamu verifikasi manual. Akun langsung
            aktif.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="user@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Password awal
              </label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="min. 6 karakter"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1 block">
                Bayar sampai (opsional)
              </label>
              <input
                type="date"
                value={paidUntil}
                onChange={(e) => setPaidUntil(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-2 rounded-full bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-5 py-2.5 text-sm font-medium transition w-fit"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Buat Akun
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100">
        {loading && <p className="p-4 text-sm text-neutral-400">Memuat...</p>}
        {!loading && users.length === 0 && (
          <p className="p-4 text-sm text-neutral-400">Belum ada user.</p>
        )}
        {users.map((u) => (
          <div key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm flex items-center gap-1.5">
                {u.email}
                {u.role === "admin" && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-indigo-600 bg-indigo-50 rounded-full px-2 py-0.5">
                    <ShieldCheck size={11} /> admin
                  </span>
                )}
              </p>
              <p className="text-xs text-neutral-400">
                Terdaftar {new Date(u.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="date"
                defaultValue={u.paid_until ?? ""}
                onBlur={(e) => updatePaidUntil(u, e.target.value)}
                className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs"
                title="Bayar sampai"
              />

              <button
                onClick={() => toggleActive(u)}
                disabled={u.role === "admin"}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition disabled:opacity-40 ${
                  u.is_active
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                }`}
              >
                {u.is_active ? "Aktif" : "Nonaktif"}
              </button>

              {u.role !== "admin" && (
                <button
                  onClick={() => handleDelete(u)}
                  className="text-neutral-300 hover:text-red-600 transition"
                  title="Hapus user"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
