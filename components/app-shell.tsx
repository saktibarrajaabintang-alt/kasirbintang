"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Box,
  ChevronDown,
  CircleDashed,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { clearSessionCookie, type SessionUser } from "@/lib/auth";

const adminNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ShoppingCart },
  { href: "/produk", label: "Produk", icon: Package },
  { href: "/stok", label: "Stok", icon: Box },
  { href: "/member", label: "Member", icon: Users },
  { href: "/karyawan", label: "Kelola Karyawan", icon: Users },
  { href: "/laporan", label: "Laporan", icon: TrendingUp },
];

const cashierNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ShoppingCart },
  { href: "/member", label: "Member", icon: Users },
];

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = user.role === "ADMIN" ? adminNavigation : cashierNavigation;

  const handleLogout = () => {
    clearSessionCookie();
    if (typeof window !== "undefined") {
      localStorage.removeItem("kasirbintang-app-state");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F3F7FB] text-[#243B53]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] flex-shrink-0 border-r border-[#D8E5F0] bg-white md:block">
          <div className="flex items-center gap-3 border-b border-[#EAF2FA] px-5 py-4">
            <img
              src="/logo.png"
              alt="Logo Tekno Citra Negara"
              className="h-11 w-11 rounded-xl object-cover shadow-sm"
            />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#71879D]">Business Center</div>
              <div className="text-base font-bold text-[#243B53]">Tekno Citra Negara</div>
            </div>
          </div>

          <nav className="space-y-2 px-3 py-4">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? "bg-[#EAF2FA] text-[#5285C0] shadow-sm"
                      : "text-[#243B53] hover:bg-[#F3F8FC]"
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              );
            })}

            <div className="my-4 border-t border-[#D8E5F0] pt-4">
              <div className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71879D]">
                Sistem
              </div>
              <Link
                href="/pengaturan"
                className={`mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname === "/pengaturan" ? "bg-[#EAF2FA] text-[#5285C0]" : "text-[#243B53] hover:bg-[#F3F8FC]"
                }`}
              >
                <Settings size={18} />
                <span>Pengaturan</span>
              </Link>
            </div>
          </nav>

          <div className="mt-4 border-t border-[#D8E5F0] px-4 py-4">
            <div className="flex items-center gap-2 rounded-xl bg-[#F3F8FC] px-3 py-2 text-sm text-[#3F6F9F]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium">Sistem Online</span>
            </div>
            <div className="mt-2 text-sm text-[#71879D]">Business Center siap digunakan.</div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#D8E5F0] bg-white/90 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] text-[#5285C0] md:hidden">
                  <ChevronDown size={18} />
                </button>

                <div className="relative w-full max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
                  <input
                    className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F7FB] py-2.5 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-[#71879D] focus:border-[#5285C0]"
                    placeholder="Cari produk, member, transaksi..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] text-[#5285C0] transition hover:bg-[#EAF2FA]">
                  <Bell size={18} />
                  <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-[#5285C0]" />
                </button>

                <div className="flex items-center gap-3 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-2 py-1.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5285C0] font-semibold text-white">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-semibold text-[#243B53]">{user.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.15em] text-[#71879D]">
                      {user.role === "ADMIN" ? "Administrator" : "Petugas / Kasir"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl border border-[#D8E5F0] bg-white px-3 py-2 text-sm font-medium text-[#243B53] transition hover:border-[#5285C0] hover:text-[#5285C0]"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function SimpleBadge({ label, tone = "blue" }: { label: string; tone?: "blue" | "green" | "amber" | "red" }) {
  const toneMap = {
    blue: "bg-[#EAF2FA] text-[#3F6F9F]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneMap[tone]}`}>{label}</span>;
}

export function StatCard({
  title,
  value,
  suffix,
  icon,
}: {
  title: string;
  value: string;
  suffix?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4 shadow-[0_8px_24px_rgba(82,133,192,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(82,133,192,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-[#71879D]">{title}</div>
          <div className="mt-2 text-2xl font-bold text-[#243B53]">{value}</div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF2FA] text-[#5285C0]">{icon}</div>
      </div>
      {suffix ? <div className="mt-2 text-xs text-[#71879D]">{suffix}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D8E5F0] bg-[#F3F8FC] p-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#5285C0] shadow-sm">
        <CircleDashed size={28} />
      </div>
      <h3 className="text-lg font-semibold text-[#243B53]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#71879D]">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
