"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { createSessionCookieValue, verifyPassword } from "@/lib/auth";
import { loadAppState } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const state = loadAppState();
    const user = state.users.find((item) => item.username === username.trim());

    if (!user) {
      setError("Username tidak ditemukan.");
      setLoading(false);
      return;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      setError("Password salah. Silakan coba lagi.");
      setLoading(false);
      return;
    }

    const session = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    };

    document.cookie = `pos_session=${createSessionCookieValue(session)}; path=/; max-age=86400; samesite=lax`;
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F3F7FB] px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[24px] border border-[#D8E5F0] bg-white shadow-[0_18px_44px_rgba(82,133,192,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-[radial-gradient(circle_at_top_left,_rgba(82,133,192,0.12),_transparent_35%),linear-gradient(135deg,_#F5F9FD_0%,_#EAF2FA_100%)] p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#3F6F9F] shadow-sm">
              <ShieldCheck size={18} />
              Business Center System
            </div>
            <h1 className="text-4xl font-bold text-[#243B53]">Tekno Citra Negara</h1>
            <p className="mt-3 max-w-md text-base text-[#71879D]">
              Aplikasi POS profesional untuk operasional usaha, transaksi, stok, member, dan laporan harian.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#D8E5F0] bg-white/80 p-4">
              <div className="text-sm font-semibold text-[#243B53]">Demo akses</div>
              <div className="mt-3 space-y-2 text-sm text-[#71879D]">
                <div>Admin: admin / admin123</div>
                <div>Kasir: kasir / kasir123</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:text-left">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5285C0] text-white shadow-sm lg:mx-0">
                <LockKeyhole size={28} />
              </div>
              <h2 className="mt-5 text-3xl font-bold text-[#243B53]">Masuk ke sistem</h2>
              <p className="mt-2 text-sm text-[#71879D]">Silakan login untuk mulai operasional kasir.</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#243B53]">
                  <UserRound size={16} /> Username
                </span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-4 py-3 text-sm text-[#243B53] outline-none transition focus:border-[#5285C0]"
                  placeholder="Masukkan username"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-medium text-[#243B53]">
                  <LockKeyhole size={16} /> Password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-4 py-3 pr-11 text-sm text-[#243B53] outline-none transition focus:border-[#5285C0]"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71879D]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#5285C0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#3F6F9F] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Memeriksa login..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
