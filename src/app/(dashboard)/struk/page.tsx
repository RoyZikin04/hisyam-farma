"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Search,
  Calendar,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CheckSquare,
  Square,
  Layers,
  RefreshCw,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import ModalCetakStruk from "@/components/struk/ModalCetakStruk";
import { TransaksiData, PengaturanTokoData } from "@/components/struk/StrukView";

export default function DaftarStrukPage() {
  const [transaksiList, setTransaksiList] = useState<TransaksiData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [tipe, setTipe] = useState(""); // "", "KELUAR", "MASUK"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Selection for Batch Print
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingBatchAll, setLoadingBatchAll] = useState(false);

  // Print Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [printItems, setPrintItems] = useState<TransaksiData[]>([]);
  const [pengaturan, setPengaturan] = useState<PengaturanTokoData | undefined>();

  // Fetch Pengaturan Toko
  useEffect(() => {
    fetch("/api/pengaturan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPengaturan(data);
      })
      .catch((err) => console.error("Gagal memuat pengaturan:", err));
  }, []);

  // Fetch Transaksi
  const fetchTransaksi = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "10");
      if (search.trim()) params.set("q", search.trim());
      if (tipe) params.set("tipe", tipe);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/transaksi?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransaksiList(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Gagal mengambil data transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, tipe, startDate, endDate]);

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  // Handle Checkbox Selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCurrentPage = () => {
    const currentPageIds = transaksiList.map((t) => t.id);
    const allSelected = currentPageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      // Unselect current page
      setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    } else {
      // Select all in current page
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  // Cetak Single Struk
  const handlePrintSingle = (trx: TransaksiData) => {
    setPrintItems([trx]);
    setModalOpen(true);
  };

  // Cetak Batch Terpilih
  const handlePrintBatchSelected = () => {
    const selectedTransactions = transaksiList.filter((t) =>
      selectedIds.includes(t.id)
    );
    if (selectedTransactions.length === 0) return;
    setPrintItems(selectedTransactions);
    setModalOpen(true);
  };

  // Cetak Semua Transaksi Sesuai Filter
  const handlePrintAllFiltered = async () => {
    setLoadingBatchAll(true);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      if (search.trim()) params.set("q", search.trim());
      if (tipe) params.set("tipe", tipe);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/transaksi?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          setPrintItems(data.items);
          setModalOpen(true);
        } else {
          alert("Tidak ada transaksi untuk dicetak pada filter ini.");
        }
      }
    } catch (err) {
      console.error("Gagal mengambil semua transaksi:", err);
      alert("Gagal memuat seluruh data transaksi untuk dicetak.");
    } finally {
      setLoadingBatchAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            <span>Daftar Struk & Riwayat Transaksi</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola dan cetak ulang struk penjualan kasir (POS) serta bukti restock inventori.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handlePrintBatchSelected}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Terpilih ({selectedIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrintAllFiltered}
            disabled={loadingBatchAll || total === 0}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {loadingBatchAll ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Layers className="w-4 h-4 text-emerald-400" />
            )}
            <span>Cetak Semua ({total})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari No. Struk / Nama Obat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Tipe Transaksi */}
          <div>
            <select
              value={tipe}
              onChange={(e) => {
                setTipe(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="">Semua Jenis Transaksi</option>
              <option value="KELUAR">Penjualan Kasir (KELUAR)</option>
              <option value="MASUK">Restock Inventori (MASUK)</option>
            </select>
          </div>

          {/* Filter Tanggal Mulai */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            />
          </div>

          {/* Filter Tanggal Sampai */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            />
          </div>
        </div>

        {/* Baris Status Seleksi & Reset */}
        {(search || tipe || startDate || endDate || selectedIds.length > 0) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <div className="text-slate-500 flex items-center gap-2">
              {selectedIds.length > 0 && (
                <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  {selectedIds.length} struk dipilih
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTipe("");
                setStartDate("");
                setEndDate("");
                setSelectedIds([]);
                setPage(1);
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Reset Filter & Pilihan
            </button>
          </div>
        )}
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="p-4 w-12 text-center">
                  <button
                    type="button"
                    onClick={selectAllCurrentPage}
                    className="cursor-pointer text-slate-500 hover:text-emerald-600"
                    title="Pilih Semua Halaman Ini"
                  >
                    {transaksiList.length > 0 &&
                    transaksiList.every((t) => selectedIds.includes(t.id)) ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">No. Transaksi</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Tipe Transaksi</th>
                <th className="p-4">Petugas / Kasir</th>
                <th className="p-4">Daftar Barang</th>
                <th className="p-4 text-right">Total Transaksi</th>
                <th className="p-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat riwayat struk...</span>
                  </td>
                </tr>
              ) : transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Belum ada transaksi ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan pencarian atau filter rentang tanggal.
                    </p>
                  </td>
                </tr>
              ) : (
                transaksiList.map((trx) => {
                  const isSelected = selectedIds.includes(trx.id);
                  const isKeluar = trx.tipe === "KELUAR";

                  return (
                    <tr
                      key={trx.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(trx.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-900">
                        {trx.no_transaksi}
                      </td>

                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {formatTanggalWaktu(trx.tanggal)}
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] tracking-wide uppercase ${
                            isKeluar
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isKeluar ? "PENJUALAN POS" : "RESTOCK MASUK"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-700 font-medium">
                        {trx.user?.nama || "Kasir"}
                        <span className="text-[10px] text-slate-400 block font-normal">
                          @{trx.user?.username || "-"}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 max-w-xs">
                        <div className="truncate font-medium text-slate-800">
                          {trx.items && trx.items.length > 0
                            ? trx.items.map((i) => i.nama_barang).join(", ")
                            : "-"}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {trx.items?.length || 0} item barang
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(trx.grand_total)}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handlePrintSingle(trx)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
                          title="Pratinjau & Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Menampilkan <strong>{transaksiList.length}</strong> dari{" "}
            <strong>{total}</strong> transaksi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium">
              Hal {page} dari {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Cetak Struk (Mendukung Single & Batch Print) */}
      <ModalCetakStruk
        transaksiList={printItems}
        pengaturan={pengaturan}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPrintItems([]);
        }}
      />
    </div>
  );
}
