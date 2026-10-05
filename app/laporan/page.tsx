"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CreditCard, Download, PackageCheck, Printer, TrendingUp } from "lucide-react";
import { AppShell, EmptyState, SimpleBadge, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { formatCurrency, formatDate, loadAppState, loadSharedAppState } from "@/lib/store";
import type { Transaction } from "@/lib/types";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" }).format(new Date(value));

export default function LaporanPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [range, setRange] = useState("30");

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
    void loadSharedAppState().then(setState);

    const handleStateSync = () => setState(loadAppState());
    window.addEventListener("kasirbintang-state-updated", handleStateSync);
    window.addEventListener("storage", handleStateSync);
    window.addEventListener("focus", handleStateSync);

    return () => {
      window.removeEventListener("kasirbintang-state-updated", handleStateSync);
      window.removeEventListener("storage", handleStateSync);
      window.removeEventListener("focus", handleStateSync);
    };
  }, []);

  const report = useMemo(() => {
    const days = Number(range);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const transactions = state.transactions
      .filter((transaction) => {
        const createdAt = new Date(transaction.createdAt);
        return createdAt >= start && createdAt <= today;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

    const paymentMethods = [
      { key: "TUNAI" as const, label: "Tunai", color: "bg-[#5285C0]" },
      { key: "QRIS" as const, label: "QRIS", color: "bg-[#6F9DCA]" },
      { key: "DEBIT" as const, label: "Debit", color: "bg-[#3F6F9F]" },
    ].map((method) => {
      const matching = transactions.filter((transaction) => transaction.paymentMethod === method.key);
      return {
        ...method,
        count: matching.length,
        total: matching.reduce((sum, transaction) => sum + transaction.total, 0),
      };
    });

    const dailyMap = new Map<string, { date: string; total: number; count: number }>();
    transactions.forEach((transaction) => {
      const key = localDateKey(new Date(transaction.createdAt));
      const current = dailyMap.get(key) ?? { date: transaction.createdAt, total: 0, count: 0 };
      current.total += transaction.total;
      current.count += 1;
      dailyMap.set(key, current);
    });
    const dailySales = Array.from(dailyMap.values()).sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());

    const productMap = new Map<string, { name: string; quantity: number; total: number }>();
    transactions.forEach((transaction) => transaction.items.forEach((item) => {
      const current = productMap.get(item.productId) ?? { name: item.name, quantity: 0, total: 0 };
      current.quantity += item.quantity;
      current.total += item.price * item.quantity;
      productMap.set(item.productId, current);
    }));
    const products = Array.from(productMap.values()).sort((left, right) => right.total - left.total).slice(0, 8);

    const cashierMap = new Map<string, { name: string; count: number; total: number }>();
    transactions.forEach((transaction) => {
      const current = cashierMap.get(transaction.cashierId) ?? { name: transaction.cashierName, count: 0, total: 0 };
      current.count += 1;
      current.total += transaction.total;
      cashierMap.set(transaction.cashierId, current);
    });

    const totalIncome = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
    return {
      transactions,
      paymentMethods,
      dailySales,
      products,
      cashiers: Array.from(cashierMap.values()).sort((left, right) => right.total - left.total),
      totalIncome,
      totalTransactions: transactions.length,
      productUnits: transactions.reduce((sum, transaction) => sum + transaction.items.reduce((inner, item) => inner + item.quantity, 0), 0),
      averageTransaction: transactions.length ? totalIncome / transactions.length : 0,
    };
  }, [range, state.transactions]);

  const handleExportPdf = () => {
    const printWindow = window.open("", "_blank", "width=1100,height=800");
    if (!printWindow) return;

    const paymentRows = report.paymentMethods.map((item) => `<tr><td>${item.label}</td><td>${item.count} transaksi</td><td>${formatCurrency(item.total)}</td></tr>`).join("");
    const productRows = report.products.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.name)}</td><td>${item.quantity}</td><td>${formatCurrency(item.total)}</td></tr>`).join("");
    const cashierRows = report.cashiers.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.count}</td><td>${formatCurrency(item.total)}</td></tr>`).join("");
    const transactionRows = report.transactions.map((transaction) => `<tr><td>${escapeHtml(transaction.transactionNumber)}</td><td>${escapeHtml(transaction.cashierName)}</td><td>${formatDate(transaction.createdAt)}</td><td>${transaction.paymentMethod}</td><td class="right">${formatCurrency(transaction.total)}</td></tr>`).join("");
    const dailyRows = report.dailySales.map((item) => `<tr><td>${formatShortDate(item.date)}</td><td>${item.count}</td><td>${formatCurrency(item.total)}</td></tr>`).join("");

    printWindow.document.write(`<!doctype html><html><head><meta charset="UTF-8" /><title>Laporan Keuangan</title><style>
      @page { size: A4; margin: 14mm; } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; color: #243B53; margin: 0; font-size: 11px; } h1 { margin: 0; font-size: 22px; } h2 { margin: 22px 0 8px; font-size: 14px; border-bottom: 2px solid #5285C0; padding-bottom: 5px; } .muted { color: #71879D; } .header { display: flex; justify-content: space-between; border-bottom: 3px solid #5285C0; padding-bottom: 12px; } .header-right { text-align: right; } .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; } .card { border: 1px solid #D8E5F0; border-radius: 7px; padding: 10px; } .card-label { color: #71879D; font-size: 10px; } .card-value { font-weight: bold; font-size: 15px; margin-top: 5px; } .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; } table { width: 100%; border-collapse: collapse; } th { background: #EAF2FA; color: #3F6F9F; text-align: left; } th, td { border-bottom: 1px solid #EAF2FA; padding: 6px 5px; vertical-align: top; } .right { text-align: right; } .footer { margin-top: 24px; border-top: 1px solid #D8E5F0; padding-top: 8px; font-size: 10px; }
    </style></head><body><div class="header"><div><div class="muted">TEKNO CITRA NEGARA BUSINESS CENTER</div><h1>Laporan Keuangan</h1><div class="muted">Periode: ${range === "1" ? "Hari ini" : `${range} hari terakhir`}</div></div><div class="header-right"><strong>Dicetak</strong><br />${formatDate(new Date().toISOString())}</div></div>
      <div class="cards"><div class="card"><div class="card-label">Total Pendapatan</div><div class="card-value">${formatCurrency(report.totalIncome)}</div></div><div class="card"><div class="card-label">Total Transaksi</div><div class="card-value">${report.totalTransactions}</div></div><div class="card"><div class="card-label">Produk Terjual</div><div class="card-value">${report.productUnits}</div></div><div class="card"><div class="card-label">Rata-rata Transaksi</div><div class="card-value">${formatCurrency(report.averageTransaction)}</div></div></div>
      <div class="columns"><section><h2>Distribusi Pembayaran</h2><table><thead><tr><th>Metode</th><th>Jumlah</th><th>Pendapatan</th></tr></thead><tbody>${paymentRows || '<tr><td colspan="3">Belum ada transaksi</td></tr>'}</tbody></table></section><section><h2>Penjualan Harian</h2><table><thead><tr><th>Tanggal</th><th>Transaksi</th><th>Pendapatan</th></tr></thead><tbody>${dailyRows || '<tr><td colspan="3">Belum ada transaksi</td></tr>'}</tbody></table></section></div>
      <div class="columns"><section><h2>Produk Terlaris</h2><table><thead><tr><th>#</th><th>Produk</th><th>Qty</th><th>Total</th></tr></thead><tbody>${productRows || '<tr><td colspan="4">Belum ada data</td></tr>'}</tbody></table></section><section><h2>Performa Kasir</h2><table><thead><tr><th>Kasir</th><th>Transaksi</th><th>Pendapatan</th></tr></thead><tbody>${cashierRows || '<tr><td colspan="3">Belum ada data</td></tr>'}</tbody></table></section></div>
      <h2>Detail Transaksi</h2><table><thead><tr><th>Nomor</th><th>Kasir</th><th>Tanggal</th><th>Metode</th><th>Total</th></tr></thead><tbody>${transactionRows || '<tr><td colspan="5">Belum ada transaksi pada periode ini</td></tr>'}</tbody></table><div class="footer">Laporan ini dibuat dari data transaksi yang tersimpan di sistem POS Tekno Citra Negara.</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    let hasPrinted = false;
    const printReport = () => {
      if (hasPrinted) return;
      hasPrinted = true;
      printWindow.focus();
      printWindow.print();
    };
    printWindow.onload = printReport;
    window.setTimeout(printReport, 500);
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Laporan</div><h1 className="mt-1 text-3xl font-bold text-[#243B53]">Laporan Keuangan</h1><p className="mt-1 text-sm text-[#71879D]">Ringkasan pendapatan, pembayaran, produk, kasir, dan transaksi.</p></div>
          <div className="flex flex-wrap gap-2">
            {[{ value: "1", label: "Hari ini" }, { value: "7", label: "7 hari" }, { value: "30", label: "30 hari" }].map((item) => <button key={item.value} onClick={() => setRange(item.value)} className={`rounded-xl px-3 py-2 text-sm font-medium ${range === item.value ? "bg-[#5285C0] text-white" : "border border-[#D8E5F0] bg-white text-[#243B53]"}`}>{item.label}</button>)}
            <button onClick={handleExportPdf} className="inline-flex items-center gap-2 rounded-xl bg-[#243B53] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]"><Download size={16} /> Ekspor PDF</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Pendapatan" value={formatCurrency(report.totalIncome)} icon={<TrendingUp size={18} />} />
          <StatCard title="Total Transaksi" value={String(report.totalTransactions)} icon={<BarChart3 size={18} />} />
          <StatCard title="Produk Terjual" value={String(report.productUnits)} icon={<PackageCheck size={18} />} />
          <StatCard title="Rata-rata Transaksi" value={formatCurrency(report.averageTransaction)} icon={<CreditCard size={18} />} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5"><h2 className="mb-4 text-lg font-bold text-[#243B53]">Distribusi pembayaran</h2><div className="space-y-4">{report.paymentMethods.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-sm text-[#243B53]"><span>{item.label}</span><span>{item.count} transaksi Â· {formatCurrency(item.total)}</span></div><div className="h-2.5 rounded-full bg-[#EAF2FA]"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(item.count ? 8 : 0, (item.count / Math.max(1, report.totalTransactions)) * 100)}%` }} /></div></div>)}</div></div>
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-[#243B53]">Penjualan harian</h2><SimpleBadge label={`${range} hari`} tone="blue" /></div>{report.dailySales.length === 0 ? <EmptyState title="Belum ada data" description="Belum ada transaksi pada periode yang dipilih." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#F3F8FC] text-[#71879D]"><tr><th className="px-3 py-2 font-medium">Tanggal</th><th className="px-3 py-2 font-medium">Transaksi</th><th className="px-3 py-2 text-right font-medium">Pendapatan</th></tr></thead><tbody>{report.dailySales.map((item) => <tr key={item.date} className="border-t border-[#EAF2FA]"><td className="px-3 py-2">{formatShortDate(item.date)}</td><td className="px-3 py-2">{item.count}</td><td className="px-3 py-2 text-right font-semibold text-[#3F6F9F]">{formatCurrency(item.total)}</td></tr>)}</tbody></table></div>}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5"><h2 className="mb-4 text-lg font-bold text-[#243B53]">Produk terlaris</h2>{report.products.length === 0 ? <EmptyState title="Belum ada data" description="Produk terjual akan tampil setelah ada transaksi." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#F3F8FC] text-[#71879D]"><tr><th className="px-3 py-2 font-medium">Produk</th><th className="px-3 py-2 font-medium">Qty</th><th className="px-3 py-2 text-right font-medium">Total</th></tr></thead><tbody>{report.products.map((item) => <tr key={item.name} className="border-t border-[#EAF2FA]"><td className="px-3 py-2 font-medium">{item.name}</td><td className="px-3 py-2">{item.quantity}</td><td className="px-3 py-2 text-right font-semibold text-[#3F6F9F]">{formatCurrency(item.total)}</td></tr>)}</tbody></table></div>}</div>
          <div className="rounded-2xl border border-[#D8E5F0] bg-white p-5"><h2 className="mb-4 text-lg font-bold text-[#243B53]">Performa kasir</h2>{report.cashiers.length === 0 ? <EmptyState title="Belum ada data" description="Performa kasir akan tampil setelah ada transaksi." /> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#F3F8FC] text-[#71879D]"><tr><th className="px-3 py-2 font-medium">Kasir</th><th className="px-3 py-2 font-medium">Transaksi</th><th className="px-3 py-2 text-right font-medium">Pendapatan</th></tr></thead><tbody>{report.cashiers.map((item) => <tr key={item.name} className="border-t border-[#EAF2FA]"><td className="px-3 py-2 font-medium">{item.name}</td><td className="px-3 py-2">{item.count}</td><td className="px-3 py-2 text-right font-semibold text-[#3F6F9F]">{formatCurrency(item.total)}</td></tr>)}</tbody></table></div>}</div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D8E5F0] bg-white"><div className="flex items-center justify-between border-b border-[#EAF2FA] p-5"><div><h2 className="text-lg font-bold text-[#243B53]">Detail transaksi</h2><p className="mt-1 text-sm text-[#71879D]">{report.totalTransactions} transaksi pada periode yang dipilih.</p></div><Printer size={20} className="text-[#5285C0]" /></div>{report.transactions.length === 0 ? <div className="p-6"><EmptyState title="Belum ada transaksi" description="Detail transaksi akan tampil pada periode yang memiliki penjualan." /></div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-[#F3F8FC] text-[#71879D]"><tr><th className="px-4 py-3 font-medium">Nomor</th><th className="px-4 py-3 font-medium">Kasir</th><th className="px-4 py-3 font-medium">Tanggal</th><th className="px-4 py-3 font-medium">Metode</th><th className="px-4 py-3 text-right font-medium">Total</th></tr></thead><tbody>{report.transactions.map((transaction: Transaction) => <tr key={transaction.id} className="border-t border-[#EAF2FA] hover:bg-[#F3F8FC]"><td className="px-4 py-3 font-semibold text-[#243B53]">{transaction.transactionNumber}</td><td className="px-4 py-3">{transaction.cashierName}</td><td className="px-4 py-3">{formatDate(transaction.createdAt)}</td><td className="px-4 py-3"><SimpleBadge label={transaction.paymentMethod} tone="blue" /></td><td className="px-4 py-3 text-right font-semibold text-[#3F6F9F]">{formatCurrency(transaction.total)}</td></tr>)}</tbody></table></div>}</div>
      </div>
    </AppShell>
  );
}
