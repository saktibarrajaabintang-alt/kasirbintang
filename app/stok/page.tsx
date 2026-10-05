"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { AppShell, EmptyState, SimpleBadge, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { formatCurrency, getStockStatus, loadAppState, loadSharedAppState, saveAppState } from "@/lib/store";

export default function StokPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState(0);

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
    window.addEventListener("focus", handleStateSync);

    const handleVisibilityChange = () => {
      if (!document.hidden) handleStateSync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("kasirbintang-state-updated", handleStateSync);
      window.removeEventListener("storage", handleStateSync);
      window.removeEventListener("focus", handleStateSync);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleAddStock = (productId: string, value: number) => {
    setState((current) => {
      const nextState = {
        ...current,
        products: current.products.map((product) =>
          product.id === productId ? { ...product, stock: Math.max(0, product.stock + value) } : product,
        ),
      };

      saveAppState(nextState);
      return nextState;
    });
  };

  const selectedProduct = state.products.find((product) => product.id === selectedProductId) ?? null;

  const openStockModal = (productId: string) => {
    const product = state.products.find((item) => item.id === productId);
    if (!product) return;
    setSelectedProductId(productId);
    setStockAdjustment(0);
    setStockModalOpen(true);
  };

  const handleSaveStockUpdate = () => {
    if (!selectedProductId) return;

    const nextValue = Number(stockAdjustment);
    if (!Number.isFinite(nextValue)) return;

    setState((current) => {
      const nextState = {
        ...current,
        products: current.products.map((product) =>
          product.id === selectedProductId ? { ...product, stock: Math.max(0, product.stock + nextValue) } : product,
        ),
      };

      saveAppState(nextState);
      return nextState;
    });
    setStockModalOpen(false);
    setSelectedProductId(null);
    setStockAdjustment(0);
  };

  if (!user) return null;

  const safeProducts = state.products.filter((item) => item.status === "ACTIVE");
  const lowStock = safeProducts.filter((item) => item.stock > 0 && item.stock <= 5).length;
  const outOfStock = safeProducts.filter((item) => item.stock === 0).length;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Stok</div>
          <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Manajemen Stok</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Produk" value={String(safeProducts.length)} icon={<TrendingUp size={18} />} />
          <StatCard title="Stok Menipis" value={String(lowStock)} icon={<Plus size={18} />} />
          <StatCard title="Stok Habis" value={String(outOfStock)} icon={<Plus size={18} />} />
        </div>

        <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
          {safeProducts.length === 0 ? (
            <EmptyState title="Belum ada data" description="Belum ada produk aktif yang tersedia untuk dipantau stok." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F3F8FC] text-[#71879D]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Produk</th>
                    <th className="px-4 py-3 font-medium">Kode</th>
                    <th className="px-4 py-3 font-medium">Harga</th>
                    <th className="px-4 py-3 font-medium">Stok</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {safeProducts.map((product) => (
                    <tr key={product.id} className="border-t border-[#EAF2FA] align-middle hover:bg-[#F3F8FC]">
                      <td className="px-4 py-3 font-medium text-[#243B53]">{product.name}</td>
                      <td className="px-4 py-3 text-[#243B53]">{product.code}</td>
                      <td className="px-4 py-3 text-[#243B53]">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-[#243B53]">{product.stock}</td>
                      <td className="px-4 py-3">
                        <SimpleBadge label={getStockStatus(product.stock)} tone={product.stock === 0 ? "red" : product.stock <= 5 ? "amber" : "green"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openStockModal(product.id)} className="rounded-lg border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-1.5 text-xs font-semibold text-[#3F6F9F]">Update</button>
                          <button onClick={() => handleAddStock(product.id, 5)} className="rounded-lg border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-1.5 text-xs font-semibold text-[#3F6F9F]">+5</button>
                          <button onClick={() => handleAddStock(product.id, 10)} className="rounded-lg border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-1.5 text-xs font-semibold text-[#3F6F9F]">+10</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {stockModalOpen && selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243B53]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#D8E5F0] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#243B53]">Update Stok</h3>
              <button onClick={() => setStockModalOpen(false)} className="rounded-lg border border-[#D8E5F0] px-3 py-1.5 text-sm text-[#71879D]">Tutup</button>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-[#F3F8FC] p-3 text-sm text-[#243B53]">
                <div className="font-semibold">{selectedProduct.name}</div>
                <div className="mt-1 text-[#71879D]">Stok saat ini: {selectedProduct.stock}</div>
              </div>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Jumlah perubahan stok</span>
                <input
                  type="number"
                  value={stockAdjustment}
                  onChange={(event) => setStockAdjustment(Number(event.target.value))}
                  className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]"
                  placeholder="Contoh: 10 atau -5"
                />
              </label>

              <div className="flex gap-2">
                <button onClick={() => setStockAdjustment(5)} className="flex-1 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2 text-sm font-medium text-[#3F6F9F]">+5</button>
                <button onClick={() => setStockAdjustment(10)} className="flex-1 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2 text-sm font-medium text-[#3F6F9F]">+10</button>
                <button onClick={() => setStockAdjustment(-5)} className="flex-1 rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2 text-sm font-medium text-[#3F6F9F]">-5</button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setStockModalOpen(false)} className="rounded-xl border border-[#D8E5F0] bg-white px-4 py-2.5 text-sm font-medium text-[#243B53]">Batal</button>
              <button onClick={handleSaveStockUpdate} className="rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">Simpan Stok</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
