"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, UserPlus, Users } from "lucide-react";
import { AppShell, EmptyState, SimpleBadge, StatCard } from "@/components/app-shell";
import { hashPassword, parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { addUser, formatDate, loadAppState, saveAppState } from "@/lib/store";
import type { User } from "@/lib/types";

export default function KaryawanPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const session = parseSessionCookieValue(document.cookie.split("pos_session=")[1]?.split(";")[0]);
    if (!session) {
      window.location.href = "/login";
      return;
    }

    if (session.role !== "ADMIN") {
      window.location.href = "/dashboard";
      return;
    }

    setUser(session);
    setState(loadAppState());

    const handleStateSync = () => setState(loadAppState());
    window.addEventListener("kasirbintang-state-updated", handleStateSync);
    window.addEventListener("storage", handleStateSync);

    return () => {
      window.removeEventListener("kasirbintang-state-updated", handleStateSync);
      window.removeEventListener("storage", handleStateSync);
    };
  }, []);

  const cashierUsers = useMemo(() => state.users.filter((item) => item.role === "KASIR"), [state.users]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setError("Nama, username, dan password wajib diisi.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const exists = state.users.some((item) => item.username.toLowerCase() === form.username.trim().toLowerCase());
    if (exists) {
      setError("Username sudah digunakan, silakan pilih username lain.");
      return;
    }

    const nextUser: User = {
      id: `user-kasir-${Date.now()}`,
      name: form.name.trim(),
      username: form.username.trim(),
      passwordHash: hashPassword(form.password),
      role: "KASIR",
    };

    const nextState = addUser(state, nextUser);
    setState(nextState);
    saveAppState(nextState);

    setForm({ name: "", username: "", password: "", confirmPassword: "" });
    setSuccess(`Akun kasir ${nextUser.name} berhasil dibuat.`);
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Admin</div>
          <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Kelola Karyawan</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Karyawan" value={String(cashierUsers.length)} icon={<Users size={18} />} />
          <StatCard title="Kasir Aktif" value={String(cashierUsers.length)} icon={<ShieldCheck size={18} />} />
          <StatCard title="Admin" value={"1"} icon={<UserPlus size={18} />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#243B53]">Daftar Karyawan</h2>
              <SimpleBadge label={`${cashierUsers.length} Kasir`} tone="blue" />
            </div>

            {cashierUsers.length === 0 ? (
              <EmptyState title="Belum ada kasir" description="Belum ada akun kasir yang dibuat." />
            ) : (
              <div className="space-y-3">
                {cashierUsers.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] p-3">
                    <div>
                      <div className="font-semibold text-[#243B53]">{item.name}</div>
                      <div className="text-sm text-[#71879D]">@{item.username}</div>
                    </div>
                    <div className="text-right text-sm text-[#71879D]">
                      <div className="font-medium text-[#243B53]">Role: {item.role}</div>
                      <div>{item.createdAt ? formatDate(item.createdAt) : "Baru"}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2FA] text-[#5285C0]">
                <Plus size={18} />
              </div>
              <h2 className="text-xl font-bold text-[#243B53]">Buat Akun Kasir Baru</h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-[#243B53]">
                <span className="mb-2 block font-medium">Nama lengkap</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]"
                  placeholder="Contoh: Siti Nurhayati"
                />
              </label>

              <label className="block text-sm text-[#243B53]">
                <span className="mb-2 block font-medium">Username</span>
                <input
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]"
                  placeholder="Contoh: kasir2"
                />
              </label>

              <label className="block text-sm text-[#243B53]">
                <span className="mb-2 block font-medium">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]"
                  placeholder="Minimal 6 karakter"
                />
              </label>

              <label className="block text-sm text-[#243B53]">
                <span className="mb-2 block font-medium">Konfirmasi password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]"
                  placeholder="Ulangi password"
                />
              </label>

              {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
              {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</div> : null}

              <button type="submit" className="w-full rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
                Simpan Akun Kasir
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
