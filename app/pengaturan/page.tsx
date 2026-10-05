"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { clearSessionCookie, parseSessionCookieValue, type SessionUser } from "@/lib/auth";

export default function PengaturanPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const session = parseSessionCookieValue(document.cookie.split("pos_session=")[1]?.split(";")[0]);
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
  }, []);

  const handleLogout = () => {
    clearSessionCookie();
    window.location.href = "/login";
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Pengaturan</div>
          <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Profil Sistem</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5285C0] text-xl font-bold text-white">{user.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <div className="text-2xl font-bold text-[#243B53]">{user.name}</div>
                <div className="text-sm text-[#71879D]">{user.role === "ADMIN" ? "Administrator" : "Petugas / Kasir"}</div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-[#F3F8FC] px-4 py-3">
                <span className="text-[#71879D]">Nama</span>
                <span className="font-semibold text-[#243B53]">{user.name}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F3F8FC] px-4 py-3">
                <span className="text-[#71879D]">Username</span>
                <span className="font-semibold text-[#243B53]">{user.username}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-[#F3F8FC] px-4 py-3">
                <span className="text-[#71879D]">Role</span>
                <span className="font-semibold text-[#243B53]">{user.role}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-6">
            <div className="mb-4 flex items-center gap-2 text-[#243B53]">
              <ShieldCheck size={18} className="text-[#5285C0]" />
              <h2 className="text-lg font-bold">Informasi Sistem</h2>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-xl bg-[#F3F8FC] p-3">
                <div className="text-[#71879D]">Nama Sistem</div>
                <div className="mt-1 font-semibold text-[#243B53]">Tekno Citra Negara Business Center</div>
              </div>
              <div className="rounded-xl bg-[#F3F8FC] p-3">
                <div className="text-[#71879D]">Sekolah</div>
                <div className="mt-1 font-semibold text-[#243B53]">SMK Citra Negara</div>
              </div>
              <div className="rounded-xl bg-[#F3F8FC] p-3">
                <div className="text-[#71879D]">Jurusan</div>
                <div className="mt-1 font-semibold text-[#243B53]">TJKT</div>
              </div>
              <div className="rounded-xl bg-[#F3F8FC] p-3">
                <div className="text-[#71879D]">Versi Aplikasi</div>
                <div className="mt-1 font-semibold text-[#243B53]">1.0.0</div>
              </div>
            </div>

            <button onClick={handleLogout} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
