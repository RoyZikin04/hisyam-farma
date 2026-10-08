"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Package,
  Plus,
  Search,
  RotateCcw,
  Edit2,
  Trash2,
  Power,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import BarangModal, { BarangItem } from "@/components/barang/BarangModal";
import KonfirmasiModal from "@/components/barang/KonfirmasiModal";
import Toast from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

export default function MasterBarangPage() {
  const [items, setItems] = useState<BarangItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("aktif"); // "aktif" | "nonaktif" | "semua"
  const [sort, setSort] = useState("nama_asc");
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<BarangItem | null>(null);

  // Konfirmasi Soft Delete / Restore State
  const [konfirmasiOpen, setKonfirmasiOpen] = useState(false);
  const [barangTarget, setBarangTarget] = useState<BarangItem | null>(null);
  const [aksiTipe, setAksiTipe] = useState<"hapus" | "restore">("hapus");
  const [konfirmasiLoading, setKonfirmasiLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  const fetchBarang = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        q: search.trim(),
        status,
        sort,
      });

      const res = await fetch(`/api/barang?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setToast({ tipe: "error", pesan: data.error || "Gagal memuat data barang." });
      }
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat memuat barang." });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, sort]);

  useEffect(() => {
    fetchBarang();
  }, [fetchBarang]);

  const handleBukaTambah = () => {
    setSelectedBarang(null);
    setModalOpen(true);
  };

  const handleBukaEdit = (item: BarangItem) => {
    setSelectedBarang(item);
    setModalOpen(true);
  };

  const handleBukaKonfirmasi = (item: BarangItem, aksi: "hapus" | "restore") => {
    setBarangTarget(item);
    setAksiTipe(aksi);
    setKonfirmasiOpen(true);
  };

  const eksekusiKonfirmasi = async () => {
    if (!barangTarget?.id) return;
    setKonfirmasiLoading(true);

    try {
      const url = `/api/barang/${barangTarget.id}`;
      const method = aksiTipe === "hapus" ? "DELETE" : "PATCH";

      const res = await fetch(url, { method });
      const data = await res.json();

      if (res.ok) {
        setToast({ tipe: "sukses", pesan: data.message });
        setKonfirmasiOpen(false);
        fetchBarang();
      } else {
        setToast({ tipe: "error", pesan: data.error || "Aksi gagal diproses." });
      }
    } catch {
      setToast({ tipe: "error", pesan: "Terjadi kesalahan jaringan." });
    } finally {
      setKonfirmasiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toast && (
        <Toast
          tipe={toast.tipe}
          pesan={toast.pesan}
          onTutup={() => setToast(null)}
        />
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-emerald-600" />
            <span>Master Barang & Harga Jual</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola katalog obat dan barang apotek dengan kalkulator harga jual otomatis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBukaTambah}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Barang Baru</span>
        </button>
      </div>

      {/* Panel Toolbar Filter & Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Kolom Pencarian */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari kode atau nama barang..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Status Aktif */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="aktif">Status: Hanya Aktif</option>
              <option value="nonaktif">Status: Hanya Nonaktif</option>
              <option value="semua">Status: Semua Barang</option>
            </select>
          </div>

          {/* Pengurutan (Sorting) */}
          <div>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="nama_asc">Urutkan: Nama (A - Z)</option>
              <option value="nama_desc">Urutkan: Nama (Z - A)</option>
              <option value="kode_asc">Urutkan: Kode Barang</option>
              <option value="stok_asc">Urutkan: Stok Terendah</option>
              <option value="stok_desc">Urutkan: Stok Tertinggi</option>
              <option value="terbaru">Urutkan: Barang Terbaru</option>
            </select>
          </div>

          {/* Limit Baris Per Halaman */}
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={10}>10 Baris per Halaman</option>
              <option value={25}>25 Baris per Halaman</option>
              <option value={50}>50 Baris per Halaman</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("aktif");
                setSort("nama_asc");
                setPage(1);
              }}
              title="Reset Filter"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Master Barang */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Kode</th>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4 text-center">Satuan</th>
                <th className="py-3.5 px-4 text-right">Stok</th>
                <th className="py-3.5 px-4 text-right">Harga Beli</th>
                <th className="py-3.5 px-4 text-right">HPP (Pokok)</th>
                <th className="py-3.5 px-4 text-right">Harga Bebas</th>
                <th className="py-3.5 px-4 text-right">Harga Resep</th>
                <th className="py-3.5 px-4 text-right bg-emerald-50/60 text-emerald-800">Harga Grosir</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 font-medium">
                      <div className="w-5 h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Memuat data katalog barang...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">Tidak ada barang yang ditemukan.</p>
                      <p className="text-xs text-slate-400">Silakan sesuaikan kata kunci pencarian atau tambah barang baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !b.aktif ? "bg-slate-50/50 opacity-60" : ""
                    }`}
                  >
                    {/* Kode Barang */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 text-xs">
                      <span className="px-2 py-1 bg-slate-100 rounded-md border border-slate-200">
                        {b.kode_barang}
                      </span>
                    </td>

                    {/* Nama Barang */}
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {b.nama_barang}
                    </td>

                    {/* Satuan */}
                    <td className="py-3.5 px-4 text-center text-xs text-slate-600">
                      {b.satuan}
                    </td>

                    {/* Stok */}
                    <td className="py-3.5 px-4 text-right font-semibold">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.stok < 10
                            ? "bg-rose-100 text-rose-700"
                            : b.stok < 25
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {b.stok}
                      </span>
                    </td>

                    {/* Harga Beli */}
                    <td className="py-3.5 px-4 text-right text-slate-600 font-mono text-xs">
                      {formatRupiah(b.harga_beli)}
                    </td>

                    {/* HPP (Harga Pokok) */}
                    <td className="py-3.5 px-4 text-right text-slate-800 font-mono text-xs font-semibold">
                      {formatRupiah(b.harga_pokok)}
                    </td>

                    {/* Harga Bebas */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-800">
                      {formatRupiah(b.harga_bebas)}
                    </td>

                    {/* Harga Resep */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-800">
                      {formatRupiah(b.harga_resep)}
                    </td>

                    {/* Harga Grosir (Tampil langsung di tabel sesuai aturan) */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs font-bold bg-emerald-50/40 text-emerald-800">
                      {formatRupiah(b.harga_grosir)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          b.aktif
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {b.aktif ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBukaEdit(b)}
                          title="Ubah Data Barang"
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {b.aktif ? (
                          <button
                            type="button"
                            onClick={() => handleBukaKonfirmasi(b, "hapus")}
                            title="Nonaktifkan Barang (Soft Delete)"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBukaKonfirmasi(b, "restore")}
                            title="Aktifkan Kembali Barang"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Baris Pagination */}
        <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-700">{items.length}</span> dari{" "}
            <span className="font-semibold text-slate-700">{total}</span> total barang
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
              Halaman {page} dari {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tambah & Ubah Barang */}
      <BarangModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(pesan) => {
          setToast({ tipe: "sukses", pesan });
          fetchBarang();
        }}
        barangEdit={selectedBarang}
      />

      {/* Modal Konfirmasi Soft Delete / Restore */}
      <KonfirmasiModal
        isOpen={konfirmasiOpen}
        onClose={() => setKonfirmasiOpen(false)}
        onConfirm={eksekusiKonfirmasi}
        loading={konfirmasiLoading}
        tipe={aksiTipe === "hapus" ? "bahaya" : "info"}
        judul={
          aksiTipe === "hapus"
            ? "Nonaktifkan Barang Ini?"
            : "Aktifkan Kembali Barang Ini?"
        }
        pesan={
          aksiTipe === "hapus"
            ? `Barang "${barangTarget?.nama_barang}" (${barangTarget?.kode_barang}) akan dinonaktifkan (soft delete). Barang tidak akan muncul di daftar kasir aktif tetapi riwayat transaksi tetap terjaga.`
            : `Barang "${barangTarget?.nama_barang}" (${barangTarget?.kode_barang}) akan diaktifkan kembali dan dapat dijual di kasir.`
        }
        tombolTeks={aksiTipe === "hapus" ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
      />
    </div>
  );
}
