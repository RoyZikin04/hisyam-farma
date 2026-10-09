"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Edit2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  X,
  Search,
  Power,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { formatTanggalWaktu } from "@/lib/format";

interface UserItem {
  id: string;
  nama: string;
  username: string;
  role: "ADMIN" | "KASIR";
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function KelolaPenggunaPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Modal Tambah
  const [modalTambahOpen, setModalTambahOpen] = useState(false);
  const [formTambah, setFormTambah] = useState({
    nama: "",
    username: "",
    password: "",
    role: "KASIR" as "ADMIN" | "KASIR",
    aktif: true,
  });
  const [savingTambah, setSavingTambah] = useState(false);

  // Modal Edit
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [formEdit, setFormEdit] = useState({
    nama: "",
    username: "",
    password: "",
    role: "KASIR" as "ADMIN" | "KASIR",
    aktif: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal Konfirmasi Toggle Status
  const [confirmToggleUser, setConfirmToggleUser] = useState<UserItem | null>(null);
  const [toggling, setToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pengguna");
      if (res.ok) {
        const data = await res.json();
        setUsers(data || []);
      } else {
        const err = await res.json();
        setToast({ tipe: "error", pesan: err.error || "Gagal memuat pengguna." });
      }
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan koneksi ke server." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Tambah User
  const handleSimpanTambah = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTambah(true);
    setToast(null);

    try {
      const res = await fetch("/api/pengguna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formTambah),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal menambahkan pengguna." });
        return;
      }

      setToast({ tipe: "sukses", pesan: json.message || "Pengguna berhasil ditambahkan." });
      setModalTambahOpen(false);
      setFormTambah({
        nama: "",
        username: "",
        password: "",
        role: "KASIR",
        aktif: true,
      });
      fetchUsers();
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat menyimpan." });
    } finally {
      setSavingTambah(false);
    }
  };

  // Buka Modal Edit
  const bukaModalEdit = (u: UserItem) => {
    setSelectedUser(u);
    setFormEdit({
      nama: u.nama,
      username: u.username,
      password: "",
      role: u.role,
      aktif: u.aktif,
    });
    setModalEditOpen(true);
  };

  // Handle Simpan Edit
  const handleSimpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSavingEdit(true);
    setToast(null);

    try {
      const payload: any = {
        nama: formEdit.nama,
        username: formEdit.username,
        role: formEdit.role,
        aktif: formEdit.aktif,
      };
      if (formEdit.password && formEdit.password.trim().length >= 6) {
        payload.password = formEdit.password.trim();
      }

      const res = await fetch(`/api/pengguna/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal memperbarui pengguna." });
        return;
      }

      setToast({ tipe: "sukses", pesan: json.message || "Data pengguna berhasil diperbarui." });
      setModalEditOpen(false);
      fetchUsers();
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat memperbarui." });
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Toggle Status (Aktif / Nonaktif)
  const handleToggleAktif = async () => {
    if (!confirmToggleUser) return;
    setToggling(true);

    try {
      const newStatus = !confirmToggleUser.aktif;
      const res = await fetch(`/api/pengguna/${confirmToggleUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: newStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal mengubah status akun." });
        return;
      }

      setToast({
        tipe: "sukses",
        pesan: `Akun "${confirmToggleUser.nama}" berhasil di${newStatus ? "aktifkan" : "nonaktifkan"}.`,
      });
      setConfirmToggleUser(null);
      fetchUsers();
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat mengubah status." });
    } finally {
      setToggling(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toast && <Toast tipe={toast.tipe} pesan={toast.pesan} onClose={() => setToast(null)} />}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" />
            <span>Kelola Pengguna Sistem</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen akun petugas kasir dan administrator apotek, hak akses, dan status operasional.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalTambahOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau username pengguna..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs text-slate-500">
          Total: <strong>{users.length}</strong> Akun
        </div>
      </div>

      {/* Tabel Pengguna */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <th className="p-4 pl-6">Pengguna</th>
                <th className="p-4">Username</th>
                <th className="p-4 text-center">Peran (Role)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4">Tanggal Dibuat</th>
                <th className="p-4 text-center pr-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada pengguna ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-sm">{u.nama}</div>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-600">
                      @{u.username}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase border ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                          u.aktif
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {u.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 whitespace-nowrap">
                      {formatTanggalWaktu(u.createdAt)}
                    </td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => bukaModalEdit(u)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pengguna & Password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmToggleUser(u)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.aktif
                              ? "bg-rose-50 hover:bg-rose-100 text-rose-600"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                          }`}
                          title={u.aktif ? "Nonaktifkan Akun" : "Aktifkan Kembali Akun"}
                        >
                          <Power className="w-3.5 h-3.5" />
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

      {/* MODAL 1: TAMBAH PENGGUNA */}
      {modalTambahOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalTambahOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanTambah} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTambah.nama}
                  onChange={(e) => setFormTambah({ ...formTambah, nama: e.target.value })}
                  placeholder="Contoh: Siti Aisyah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTambah.username}
                  onChange={(e) => setFormTambah({ ...formTambah, username: e.target.value })}
                  placeholder="Contoh: sitiaisyah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Hanya huruf, angka, dan garis bawah tanpa spasi.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formTambah.password}
                  onChange={(e) => setFormTambah({ ...formTambah, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormTambah({ ...formTambah, role: "KASIR" })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formTambah.role === "KASIR"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    KASIR (POS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTambah({ ...formTambah, role: "ADMIN" })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formTambah.role === "ADMIN"
                        ? "border-purple-500 bg-purple-50 text-purple-700 font-bold ring-2 ring-purple-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    ADMIN (Penuh)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="aktif-tambah"
                  checked={formTambah.aktif}
                  onChange={(e) => setFormTambah({ ...formTambah, aktif: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="aktif-tambah" className="font-semibold text-slate-700 cursor-pointer">
                  Status Akun Aktif (Dapat Login)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTambahOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTambah}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingTambah ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT PENGGUNA */}
      {modalEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600" />
                <span>Edit Pengguna: {selectedUser.nama}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimpanEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formEdit.nama}
                  onChange={(e) => setFormEdit({ ...formEdit, nama: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formEdit.username}
                  onChange={(e) => setFormEdit({ ...formEdit, username: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ganti Password (Opsional)
                </label>
                <input
                  type="password"
                  value={formEdit.password}
                  onChange={(e) => setFormEdit({ ...formEdit, password: e.target.value })}
                  placeholder="Kosongkan jika password tidak diubah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Isi minimal 6 karakter jika ingin mereset password akun ini.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran Akun (Role)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormEdit({ ...formEdit, role: "KASIR" })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formEdit.role === "KASIR"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    KASIR
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormEdit({ ...formEdit, role: "ADMIN" })}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      formEdit.role === "ADMIN"
                        ? "border-purple-500 bg-purple-50 text-purple-700 font-bold ring-2 ring-purple-500/20"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    ADMIN
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="aktif-edit"
                  checked={formEdit.aktif}
                  onChange={(e) => setFormEdit({ ...formEdit, aktif: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="aktif-edit" className="font-semibold text-slate-700 cursor-pointer">
                  Status Akun Aktif
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KONFIRMASI STATUS (TOGGLE AKTIF / NONAKTIF) */}
      {confirmToggleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center space-y-4 animate-in zoom-in-95">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                confirmToggleUser.aktif
                  ? "bg-rose-100 text-rose-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <Power className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {confirmToggleUser.aktif ? "Nonaktifkan Akun?" : "Aktifkan Akun Kembali?"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {confirmToggleUser.aktif
                  ? `Pengguna "${confirmToggleUser.nama}" (@${confirmToggleUser.username}) tidak akan dapat login ke sistem kasir lagi.`
                  : `Pengguna "${confirmToggleUser.nama}" (@${confirmToggleUser.username}) akan dapat kembali login ke sistem.`}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmToggleUser(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={toggling}
                onClick={handleToggleAktif}
                className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 ${
                  confirmToggleUser.aktif
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {toggling
                  ? "Memproses..."
                  : confirmToggleUser.aktif
                  ? "Ya, Nonaktifkan"
                  : "Ya, Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
