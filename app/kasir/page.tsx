"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell, EmptyState } from "@/components/app-shell";
import { hashPassword, parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { addUser, deleteUser, loadAppState, saveAppState, updateUser } from "@/lib/store";
import type { User } from "@/lib/types";

const emptyForm = { name: "", username: "", password: "" };

export default function KasirPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (target: User) => {
    setEditingId(target.id);
    setForm({ name: target.name, username: target.username, password: "" });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim()) return;

    const baseUser: User = {
      id: editingId ?? `user-${Date.now()}`,
      name: form.name.trim(),
      username: form.username.trim(),
      passwordHash: editingId
        ? state.users.find((item) => item.id === editingId)?.passwordHash ?? hashPassword("kasir123")
        : hashPassword(form.password || "kasir123"),
      role: "KASIR",
    };

    const nextState = editingId ? updateUser(state, { ...baseUser, passwordHash: form.password ? hashPassword(form.password) : baseUser.passwordHash }) : addUser(state, baseUser);
    setState(nextState);
    saveAppState(nextState);
    setModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleDelete = (userId: string) => {
    const nextState = deleteUser(state, userId);
    setState(nextState);
    saveAppState(nextState);
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Kasir</div>
            <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Manajemen Kasir</h1>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
            <Plus size={16} /> Tambah Kasir
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D8E5F0] bg-white">
          {state.users.filter((item) => item.role === "KASIR").length === 0 ? (
            <div className="p-8"><EmptyState title="Belum ada kasir" description="Belum ada akun kasir yang dibuat." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F3F8FC] text-[#71879D]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Username</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.filter((item) => item.role === "KASIR").map((cashier) => (
                    <tr key={cashier.id} className="border-t border-[#EAF2FA] hover:bg-[#F3F8FC]">
                      <td className="px-4 py-3 font-medium text-[#243B53]">{cashier.name}</td>
                      <td className="px-4 py-3">{cashier.username}</td>
                      <td className="px-4 py-3">Kasir</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(cashier)} className="rounded-lg border border-[#D8E5F0] bg-white p-2 text-[#5285C0] hover:bg-[#EAF2FA]">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(cashier.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100">
                            <Trash2 size={15} />
                          </button>
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

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243B53]/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[#D8E5F0] bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#243B53]">{editingId ? "Edit Kasir" : "Tambah Kasir"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-[#D8E5F0] px-3 py-1.5 text-sm text-[#71879D]">Tutup</button>
            </div>

            <div className="space-y-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Nama</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Username</span>
                <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Password</span>
                <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" placeholder={editingId ? "Kosongkan jika tidak diubah" : "Masukkan password"} />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[#D8E5F0] bg-white px-4 py-2.5 text-sm font-medium text-[#243B53]">Batal</button>
              <button onClick={handleSave} className="rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">Simpan</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
