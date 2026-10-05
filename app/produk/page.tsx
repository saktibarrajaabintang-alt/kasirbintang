"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell, EmptyState, SimpleBadge, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { addProduct, createProductCode, deleteProduct, formatCurrency, loadAppState, saveAppState, updateProduct } from "@/lib/store";
import type { Product } from "@/lib/types";

const emptyProduct: Omit<Product, "id" | "createdAt"> = {
  name: "",
  code: "",
  price: 0,
  stock: 0,
  imageUrl: "",
  description: "",
  status: "ACTIVE",
};

export default function ProdukPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    const session = parseSessionCookieValue(document.cookie.split("pos_session=")[1]?.split(";")[0]);
    if (!session) {
      window.location.href = "/login";
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

  const filteredProducts = useMemo(() => {
    return state.products.filter((product) => {
      const matchesSearch = `${product.name} ${product.code}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || product.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [state.products, search, filterStatus]);

  const stats = useMemo(() => {
    const active = state.products.filter((item) => item.status === "ACTIVE").length;
    const lowStock = state.products.filter((item) => item.stock <= 5 && item.stock > 0).length;
    const outOfStock = state.products.filter((item) => item.stock === 0).length;
    return { total: state.products.length, active, lowStock, outOfStock };
  }, [state.products]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyProduct, code: createProductCode() });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      code: product.code,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl ?? "",
      description: product.description ?? "",
      status: product.status,
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    const trimmed = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description?.trim() ?? "",
      imageUrl: form.imageUrl?.trim() ?? "",
      price: Number(form.price),
      stock: Number(form.stock),
    };

    if (!trimmed.name || !trimmed.code) return;

    let nextState = state;
    if (editingId) {
      const product = {
        id: editingId,
        createdAt: state.products.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString(),
        ...trimmed,
      } as Product;
      nextState = updateProduct(state, product);
    } else {
      const product = {
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        ...trimmed,
      } as Product;
      nextState = addProduct(state, product);
    }

    setState(nextState);
    saveAppState(nextState);
    setShowModal(false);
    setForm(emptyProduct);
  };

  const handleDelete = (productId: string) => {
    const nextState = deleteProduct(state, productId);
    setState(nextState);
    saveAppState(nextState);
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Produk</div>
            <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Daftar Produk</h1>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
            <Plus size={16} /> Tambah Produk
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Produk" value={String(stats.total)} icon={<Plus size={18} />} />
          <StatCard title="Produk Aktif" value={String(stats.active)} icon={<AlertTriangle size={18} />} />
          <StatCard title="Stok Menipis" value={String(stats.lowStock)} icon={<AlertTriangle size={18} />} />
          <StatCard title="Stok Habis" value={String(stats.outOfStock)} icon={<Trash2 size={18} />} />
        </div>

        <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk atau kode" className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5285C0]" />
            </div>
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 text-sm text-[#243B53] outline-none focus:border-[#5285C0]">
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D8E5F0] bg-white">
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
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8">
                      <EmptyState title="Belum ada data" description="Belum ada produk yang tersedia saat ini." />
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-[#EAF2FA] align-middle hover:bg-[#F3F8FC]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={product.imageUrl ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"} alt={product.name} className="h-11 w-11 rounded-xl object-cover" />
                          <div>
                            <div className="font-semibold text-[#243B53]">{product.name}</div>
                            <div className="text-xs text-[#71879D]">{product.description ?? "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#243B53]">{product.code}</td>
                      <td className="px-4 py-3 text-[#243B53]">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3 text-[#243B53]">{product.stock}</td>
                      <td className="px-4 py-3">
                        <SimpleBadge label={product.stock <= 0 ? "Habis" : product.stock <= 5 ? "Menipis" : "Aman"} tone={product.stock <= 0 ? "red" : product.stock <= 5 ? "amber" : "green"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(product)} className="rounded-lg border border-[#D8E5F0] bg-white p-2 text-[#5285C0] transition hover:bg-[#EAF2FA]">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition hover:bg-red-100">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243B53]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-[#D8E5F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#243B53]">{editingId ? "Edit Produk" : "Tambah Produk"}</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-[#D8E5F0] px-3 py-1.5 text-sm text-[#71879D]">Tutup</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Nama produk</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Kode produk</span>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Harga</span>
                <input type="number" min={0} value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Stok</span>
                <input type="number" min={0} value={form.stock} onChange={(event) => setForm({ ...form, stock: Number(event.target.value) })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Status</span>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Product["status"] })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]">
                  <option value="ACTIVE">Aktif</option>
                  <option value="INACTIVE">Nonaktif</option>
                </select>
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Gambar URL</span>
                <input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Deskripsi</span>
                <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-[#D8E5F0] bg-white px-4 py-2.5 text-sm font-medium text-[#243B53]">Batal</button>
              <button onClick={handleSubmit} className="rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">{editingId ? "Simpan Perubahan" : "Simpan Produk"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
