"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell, EmptyState, StatCard } from "@/components/app-shell";
import { parseSessionCookieValue, type SessionUser } from "@/lib/auth";
import { addMember, createMemberCode, deleteMember, loadAppState, saveAppState, updateMember } from "@/lib/store";
import type { Member } from "@/lib/types";

const emptyMember = { name: "", code: "", phone: "" };

export default function MemberPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [state, setState] = useState(loadAppState());
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);

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

  const filteredMembers = useMemo(() => {
    return state.members.filter((member) => {
      const matchesSearch = `${member.name} ${member.code} ${member.phone}`.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [state.members, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyMember, code: createMemberCode() });
    setModalOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditingId(member.id);
    setForm({ name: member.name, code: member.code, phone: member.phone });
    setModalOpen(true);
  };

  const handleSave = () => {
    const nextForm = {
      name: form.name.trim(),
      code: form.code.trim(),
      phone: form.phone.trim(),
    };

    if (!nextForm.name || !nextForm.code) return;

    if (editingId) {
      const nextState = updateMember(state, { ...state.members.find((member) => member.id === editingId)!, ...nextForm, createdAt: state.members.find((member) => member.id === editingId)?.createdAt ?? new Date().toISOString() });
      setState(nextState);
      saveAppState(nextState);
    } else {
      const member: Member = {
        id: `member-${Date.now()}`,
        name: nextForm.name,
        code: nextForm.code,
        phone: nextForm.phone,
        createdAt: new Date().toISOString(),
      };
      const nextState = addMember(state, member);
      setState(nextState);
      saveAppState(nextState);
    }

    setModalOpen(false);
    setForm(emptyMember);
    setEditingId(null);
  };

  const handleDelete = (memberId: string) => {
    const nextState = deleteMember(state, memberId);
    setState(nextState);
    saveAppState(nextState);
  };

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.2em] text-[#71879D]">Member</div>
            <h1 className="mt-1 text-3xl font-bold text-[#243B53]">Daftar Member</h1>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">
            <Plus size={16} /> Tambah Member
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Member" value={String(state.members.length)} icon={<Search size={18} />} />
          <StatCard title="Aktif" value={String(state.members.length)} icon={<Plus size={18} />} />
          <StatCard title="Baru" value={String(Math.min(3, state.members.length))} icon={<Pencil size={18} />} />
        </div>

        <div className="rounded-2xl border border-[#D8E5F0] bg-white p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#71879D]" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, kode, atau nomor HP" className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#5285C0]" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#D8E5F0] bg-white">
          {filteredMembers.length === 0 ? (
            <div className="p-8"><EmptyState title="Belum ada data" description="Member belum terdaftar di sistem." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F3F8FC] text-[#71879D]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nama</th>
                    <th className="px-4 py-3 font-medium">Kode Member</th>
                    <th className="px-4 py-3 font-medium">Nomor HP</th>
                    <th className="px-4 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="border-t border-[#EAF2FA] hover:bg-[#F3F8FC]">
                      <td className="px-4 py-3 font-medium text-[#243B53]">{member.name}</td>
                      <td className="px-4 py-3">{member.code}</td>
                      <td className="px-4 py-3">{member.phone}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(member)} className="rounded-lg border border-[#D8E5F0] bg-white p-2 text-[#5285C0] hover:bg-[#EAF2FA]">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(member.id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100">
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
              <h3 className="text-xl font-bold text-[#243B53]">{editingId ? "Edit Member" : "Tambah Member"}</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-[#D8E5F0] px-3 py-1.5 text-sm text-[#71879D]">Tutup</button>
            </div>

            <div className="space-y-4">
              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Nama member</span>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Kode member</span>
                <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>

              <label>
                <span className="mb-2 block text-sm font-medium text-[#243B53]">Nomor HP</span>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="w-full rounded-xl border border-[#D8E5F0] bg-[#F3F8FC] px-3 py-2.5 outline-none focus:border-[#5285C0]" />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setModalOpen(false)} className="rounded-xl border border-[#D8E5F0] bg-white px-4 py-2.5 text-sm font-medium text-[#243B53]">Batal</button>
              <button onClick={handleSave} className="rounded-xl bg-[#5285C0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3F6F9F]">{editingId ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
