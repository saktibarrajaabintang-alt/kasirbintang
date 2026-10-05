"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Boxes, PackageCheck, TrendingUp, WalletCards } from "lucide-react";
import { AppShell, SimpleBadge, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { formatCurrency, loadAppState, loadSharedAppState } from "@/lib/store";

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());

  useEffect(() => {
    const session = parseSessionCookieValue(document.cookie.split("pos_session=")[1]?.split(";")[0]);
    if (!session) {
      window.location.href = "/login";
      return;
    }
    setUser(session);
    setState(loadAppState());
    void loadSharedAppState().then(setState);

    const handleStateSync = () => setState(loadAppState());
    window.addEventListener("kasirbintang-state-updated", handleStateSync);
    window.addEventListener("storage", handleStateSync);

    return () => {
      window.removeEventListener("kasirbintang-state-updated", handleStateSync);
      window.removeEventListener("storage", handleStateSync);
    };
  }, []);

  const stats = useMemo(() => {
    const totalSales = state.transactions.reduce((sum, tx) => sum + tx.total, 0);
    const totalItems = state.products.reduce((sum, product) => sum + product.stock, 0);
    const lowStockCount = state.products.filter((product) => product.stock <= 5).length;
    return {
      totalSales,
      totalTransactions: state.transactions.length,
      totalProducts: state.products.length,
      lowStockCount,
      totalItems,
    };
  }, [state]);

  const chartData = useMemo(() => {
    const labels = ["S", "S", "R", "K", "J", "S", "M"];
    const getLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const lastSevenDays = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - idx));
      return date;
    });

    const salesByDay = new Map<string, number>();
    lastSevenDays.forEach((date) => {
      salesByDay.set(getLocalDateKey(date), 0);
    });

    state.transactions.forEach((transaction) => {
      const txDate = new Date(transaction.createdAt);
      const key = getLocalDateKey(txDate);
      if (salesByDay.has(key)) {
        salesByDay.set(key, (salesByDay.get(key) ?? 0) + transaction.total);
      }
    });

    const values = lastSevenDays.map((date, index) => {
      const key = getLocalDateKey(date);
      return { label: labels[index], value: salesByDay.get(key) ?? 0 };
    });

    const maxValue = Math.max(...values.map((item) => item.value), 1);

    return values.map((item) => ({
      ...item,
      height: item.value > 0 ? (item.value / maxValue) * 100 : 18,
    }));
  }, [state.transactions]);

  const paymentBreakdown = useMemo(() => {
    const totals = { TUNAI: 0, QRIS: 0, DEBIT: 0 };
    state.transactions.forEach((transaction) => {
      totals[transaction.paymentMethod] += 1;
    });

    const total = state.transactions.length || 1;
    return [
      { label: "Tunai", value: Math.round((totals.TUNAI / total) * 100), color: "bg-[#5285C0]" },
      { label: "QRIS", value: Math.round((totals.QRIS / total) * 100), color: "bg-[#6F9DCA]" },
      { label: "Debit", value: Math.round((totals.DEBIT / total) * 100), color: "bg-[#3F6F9F]" },
    ];
  }, [state.transactions]);

  const chartTotal = chartData.reduce((sum, item) => sum + item.value, 0);

  if (!user) {
    return null;
  }

  if (user.role === "KASIR") {
    return (
      <AppShell user={user}>
        <div className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Dashboard Kasir</div>
              <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Selamat datang kembali, {user.name.split(" ")[0]}.</h1>
            </div>
            <a href="/transaksi" className="inline-flex items-center justify-center rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
              Mulai Transaksi
            </a>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="Transaksi Hari Ini" value={String(state.transactions.length)} icon={<ArrowUpRight size={18} />} />
            <StatCard title="Penjualan Hari Ini" value={formatCurrency(stats.totalSales)} icon={<WalletCards size={18} />} />
            <StatCard title="Item Terjual" value={String(stats.totalItems)} icon={<PackageCheck size={18} />} />
            <StatCard title="Transaksi Terakhir" value={String(state.transactions[0]?.transactionNumber ?? "-" )} icon={<TrendingUp size={18} />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#243B53]">Ringkasan penjualan</h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#3F6F9F]">{formatCurrency(chartTotal)}</span>
                  <SimpleBadge label="7 Hari" tone="blue" />
                </div>
              </div>
              <div className="flex h-52 items-end gap-3 pt-4">
                {chartData.map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <div className="text-[10px] font-semibold text-[#3F6F9F]">{formatCurrency(item.value)}</div>
                    <div className="w-full rounded-t-2xl bg-[#5285C0] shadow-sm" style={{ height: `${Math.max(item.height, 18)}%`, minHeight: "18px" }} />
                    <div className="text-[10px] text-[#71879D]">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
              <div className="mb-4 text-lg font-bold text-[#243B53]">Transaksi Terakhir</div>
              <div className="space-y-3">
                {state.transactions.slice(0, 4).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between border-b border-[#EAF2FA] pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-[#243B53]">{transaction.transactionNumber}</div>
                      <div className="text-xs text-[#71879D]">{new Date(transaction.createdAt).toLocaleDateString("id-ID")}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#3F6F9F]">{formatCurrency(transaction.total)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Dashboard</div>
          <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Selamat datang kembali, Admin.</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Penjualan" value={formatCurrency(stats.totalSales)} icon={<WalletCards size={18} />} />
          <StatCard title="Total Transaksi" value={String(stats.totalTransactions)} icon={<TrendingUp size={18} />} />
          <StatCard title="Total Produk" value={String(stats.totalProducts)} icon={<PackageCheck size={18} />} />
          <StatCard title="Stok Menipis" value={String(stats.lowStockCount)} icon={<Boxes size={18} />} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#243B53]">Grafik penjualan</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#3F6F9F]">{formatCurrency(chartTotal)}</span>
                <SimpleBadge label="7 Hari" tone="blue" />
              </div>
            </div>
            <div className="flex h-48 items-end gap-3 pt-4">
              {chartData.map((item, idx) => (
                <div key={`${item.label}-${idx}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <div className="text-[10px] font-semibold text-[#3F6F9F]">{formatCurrency(item.value)}</div>
                  <div className="w-full rounded-t-2xl bg-[#5285C0] shadow-sm" style={{ height: `${Math.max(item.height, 18)}%`, minHeight: "18px" }} />
                  <div className="text-[10px] text-[#71879D]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-[#243B53]">Metode pembayaran</h2>
            <div className="space-y-3">
              {paymentBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex justify-between text-sm text-[#243B53]">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#EAF2FA]">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-[#243B53]">Transaksi terbaru</h2>
            <div className="space-y-3">
              {state.transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b border-[#EAF2FA] pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-semibold text-[#243B53]">{transaction.transactionNumber}</div>
                    <div className="text-xs text-[#71879D]">{transaction.cashierName} • {new Date(transaction.createdAt).toLocaleDateString("id-ID")}</div>
                  </div>
                  <div className="text-sm font-semibold text-[#3F6F9F]">{formatCurrency(transaction.total)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5">
            <h2 className="mb-4 text-lg font-bold text-[#243B53]">Produk terlaris</h2>
            <div className="space-y-3">
              {state.products.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-xl bg-[#F3F8FC] p-3">
                  <div className="flex items-center gap-3">
                    <img src={product.imageUrl ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    <div>
                      <div className="font-medium text-[#243B53]">{product.name}</div>
                      <div className="text-xs text-[#71879D]">{product.stock} stok</div>
                    </div>
                  </div>
                  <SimpleBadge label={product.stock <= 5 ? "Stok rendah" : "Aktif"} tone={product.stock <= 5 ? "amber" : "green"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
