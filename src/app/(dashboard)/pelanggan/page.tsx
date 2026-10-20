"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Phone,
  MapPin,
  FileText,
  UserCheck,
  UserX,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Eye,
  Calendar,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";

interface PelangganItem {
  id: string;
  kode_pelanggan: string;
  nama: string;
  telepon: string | null;
  alamat: string | null;
  catatan: string | null;
  aktif: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transaksi: number;
  };
}

interface PelangganDetail extends PelangganItem {
  totalBelanja: number;
  transaksi: Array<{
    id: string;
    no_transaksi: string;
    tanggal: string;
    grand_total: number;
    items: Array<{
      nama_barang: string;
      qty: number;
      harga_satuan: number;
      subtotal: number;
    }>;
  }>;
}

export default function PelangganPage() {
  const [items, setItems] = useState<PelangganItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "nonaktif">("aktif");

  // Stats
  const [stats, setStats] = useState({
    totalSemua: 0,
    totalAktif: 0,
    totalNonaktif: 0,
  });

  // Modal Form (Tambah/Edit)
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    kode_pelanggan: "",
    nama: "",
    telepon: "",
    alamat: "",
    catatan: "",
    aktif: true,
  });
  const [saving, setSaving] = useState(false);

  // Modal Detail / Riwayat
  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [detailPelanggan, setDetailPelanggan] = useState<PelangganDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Fetch Pelanggan List
  const fetchPelanggan = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/pelanggan?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Gagal memuat pelanggan:", err);
      setToast({ tipe: "error", pesan: "Gagal memuat daftar pelanggan" });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchPelanggan();
  }, [fetchPelanggan]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      kode_pelanggan: "",
      nama: "",
      telepon: "",
      alamat: "",
      catatan: "",
      aktif: true,
    });
    setModalFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p: PelangganItem) => {
    setEditId(p.id);
    setFormData({
      kode_pelanggan: p.kode_pelanggan,
      nama: p.nama,
      telepon: p.telepon || "",
      alamat: p.alamat || "",
      catatan: p.catatan || "",
      aktif: p.aktif,
    });
    setModalFormOpen(true);
  };

  // Open Detail / Riwayat Modal
  const handleOpenDetail = async (id: string) => {
    setModalDetailOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/pelanggan/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDetailPelanggan(data);
      } else {
        setToast({ tipe: "error", pesan: "Gagal mengambil rincian pelanggan" });
      }
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan koneksi jaringan" });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Submit Form Tambah / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      setToast({ tipe: "error", pesan: "Nama pelanggan wajib diisi!" });
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/pelanggan/${editId}` : "/api/pelanggan";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal menyimpan data pelanggan" });
        return;
      }

      setToast({
        tipe: "sukses",
        pesan: editId ? "Data pelanggan berhasil diperbarui!" : "Pelanggan baru berhasil ditambahkan!",
      });
      setModalFormOpen(false);
      fetchPelanggan();
    } catch {
      setToast({ tipe: "error", pesan: "Terjadi gangguan saat menyimpan data" });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Aktif / Nonaktif
  const handleToggleStatus = async (p: PelangganItem) => {
    const aksi = p.aktif ? "menonaktifkan" : "mengaktifkan kembali";
    if (!confirm(`Apakah Anda yakin ingin ${aksi} pelanggan "${p.nama}"?`)) return;

    try {
      const res = await fetch(`/api/pelanggan/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: !p.aktif }),
      });

      if (res.ok) {
        setToast({
          tipe: "sukses",
          pesan: `Status pelanggan "${p.nama}" berhasil diubah menjadi ${p.aktif ? "Nonaktif" : "Aktif"}.`,
        });
        fetchPelanggan();
      } else {
        const err = await res.json();
        setToast({ tipe: "error", pesan: err.error || "Gagal mengubah status pelanggan" });
      }
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan koneksi jaringan" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          tipe={toast.tipe}
          pesan={toast.pesan}
          onTutup={() => setToast(null)}
        />
      )}

      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Data Pelanggan & Member
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola master data pelanggan, kontak telepon, alamat, riwayat belanja, dan status member.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchPelanggan}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* Kartu Ringkasan Metrik Pelanggan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Pelanggan
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {stats.totalSemua}
            </p>
            <span className="text-[11px] text-slate-400">Terdaftar di sistem</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Pelanggan Aktif
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              {stats.totalAktif}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Dapat bertransaksi di POS</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pelanggan Nonaktif
            </span>
            <p className="text-2xl font-bold text-slate-500 mt-1 font-mono">
              {stats.totalNonaktif}
            </p>
            <span className="text-[11px] text-slate-400">Arsip / Ditangguhkan</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-400 rounded-xl">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Bar Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Input Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-emerald-600" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari nama, kode pelanggan, nomor telepon, atau alamat..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
          />
        </div>

        {/* Tab Status Filter */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start md:self-auto">
          {(["aktif", "semua", "nonaktif"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Pelanggan */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="p-4 w-32">Kode</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Kontak / Telepon</th>
                <th className="p-4">Alamat & Catatan</th>
                <th className="p-4 text-center">Transaksi</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat data pelanggan...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data pelanggan ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? "Coba sesuaikan kata kunci pencarian Anda." : "Klik 'Tambah Pelanggan' untuk mulai mendaftarkan data."}
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((pel) => (
                  <tr
                    key={pel.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      !pel.aktif ? "bg-slate-50/40 opacity-75" : ""
                    }`}
                  >
                    <td className="p-4">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
                        {pel.kode_pelanggan}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 text-sm">{pel.nama}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">
                        Terdaftar: {new Date(pel.createdAt).toLocaleDateString("id-ID")}
                      </div>
                    </td>

                    <td className="p-4 text-slate-700">
                      {pel.telepon ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{pel.telepon}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Tidak ada nomor</span>
                      )}
                    </td>

                    <td className="p-4 text-slate-600 max-w-xs">
                      {pel.alamat ? (
                        <div className="flex items-start gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate">{pel.alamat}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                      {pel.catatan && (
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-1">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{pel.catatan}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs">
                        {pel._count?.transaksi || 0}x
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[10.5px] uppercase tracking-wide border ${
                          pel.aktif
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {pel.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Tombol Detail / Riwayat */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(pel.id)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat Riwayat Transaksi"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Tombol Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(pel)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Pelanggan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Tombol Toggle Status / Nonaktifkan */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(pel)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            pel.aktif
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={pel.aktif ? "Nonaktifkan Pelanggan" : "Aktifkan Kembali"}
                        >
                          {pel.aktif ? <Trash2 className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {items.length} dari total {total} pelanggan
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Sebelumnya
              </button>
              <span className="font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Form Tambah / Edit */}
      {modalFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold">
                  {editId ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Pelanggan (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.kode_pelanggan}
                  onChange={(e) => setFormData({ ...formData, kode_pelanggan: e.target.value.toUpperCase() })}
                  placeholder="Kosongkan untuk auto-generate (PLG-XXXX)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Budi Santoso / Dr. Hendra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.telepon}
                  onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                  placeholder="Contoh: 0812-3456-7890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Kesehatan Raya No. 12, RT 01/RW 02"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Medis / Riwayat Alergi (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Contoh: Alergi penisilin / Member diskon khusus"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {editId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="aktifCheckbox"
                    checked={formData.aktif}
                    onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="aktifCheckbox" className="font-semibold text-slate-700 cursor-pointer">
                    Pelanggan Aktif (dapat dipilih di terminal kasir)
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Riwayat Transaksi */}
      {modalDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-200" />
                <h3 className="text-base font-bold">Rincian & Riwayat Belanja Pelanggan</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDetailOpen(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {loadingDetail || !detailPelanggan ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span>Memuat detail pelanggan...</span>
                </div>
              ) : (
                <>
                  {/* Profil Singkat */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800">
                          {detailPelanggan.kode_pelanggan}
                        </span>
                        <h4 className="text-base font-bold text-slate-900">{detailPelanggan.nama}</h4>
                      </div>
                      <div className="text-slate-500 mt-1 space-y-0.5 text-[11px]">
                        <div>Telepon: {detailPelanggan.telepon || "-"}</div>
                        <div>Alamat: {detailPelanggan.alamat || "-"}</div>
                        {detailPelanggan.catatan && (
                          <div className="text-amber-700 font-medium">
                            Catatan: {detailPelanggan.catatan}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                      <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                        Total Belanja
                      </span>
                      <span className="text-lg font-bold font-mono text-emerald-700">
                        {formatRupiah(detailPelanggan.totalBelanja || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        ({detailPelanggan._count?.transaksi || 0} kali transaksi)
                      </span>
                    </div>
                  </div>

                  {/* Riwayat 10 Transaksi Terakhir */}
                  <div>
                    <h5 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Riwayat Transaksi Terakhir</span>
                    </h5>

                    {detailPelanggan.transaksi.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                        Pelanggan ini belum pernah melakukan transaksi di kasir.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                        {detailPelanggan.transaksi.map((t) => (
                          <div key={t.id} className="p-3 bg-white hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-mono font-bold text-slate-800">
                                  {t.no_transaksi}
                                </span>
                                <span className="text-slate-400 ml-2">
                                  {formatTanggalWaktu(t.tanggal)}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-emerald-700">
                                {formatRupiah(t.grand_total)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {t.items.map((i) => `${i.nama_barang} (${i.qty}x)`).join(", ")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDetailOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
