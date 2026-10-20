"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpFromLine,
  ShoppingCart,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Receipt,
  User,
  Package,
  Layers,
  ArrowRight,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";
import ModalCetakStruk from "@/components/struk/ModalCetakStruk";
import { TransaksiData, PengaturanTokoData } from "@/components/struk/StrukView";

export default function BarangKeluarPage() {
  const [transaksiList, setTransaksiList] = useState<TransaksiData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Print Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<TransaksiData | null>(null);
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

  // Fetch Transaksi KELUAR
  const fetchBarangKeluar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "15");
      params.set("tipe", "KELUAR"); // Khusus barang keluar
      if (search.trim()) params.set("q", search.trim());
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
      console.error("Gagal memuat riwayat barang keluar:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, startDate, endDate]);

  useEffect(() => {
    fetchBarangKeluar();
  }, [fetchBarangKeluar]);

  // Hitung total unit barang keluar pada halaman aktif
  const totalPcsHalaman = transaksiList.reduce((acc, t) => {
    const qtyStruk = t.items?.reduce((q, item) => q + item.qty, 0) || 0;
    return acc + qtyStruk;
  }, 0);

  const totalOmzetHalaman = transaksiList.reduce((acc, t) => acc + t.grand_total, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
            <ArrowUpFromLine className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Mutasi & Riwayat Barang Keluar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau rincian pengeluaran stok obat, penjualan kasir, dan kuantitas unit keluar per tanggal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchBarangKeluar}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>

          {/* Tombol Akses Cepat Terminal Kasir (Input Barang Keluar Baru) */}
          <Link
            href="/transaksi/kasir"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Transaksi Kasir (POS)</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* Kartu Ringkasan Metrik Barang Keluar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Struk Keluar
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {total} <span className="text-xs font-normal text-slate-500">transaksi</span>
            </p>
            <span className="text-[11px] text-slate-400">Tercatat di sistem</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
              Unit Barang Keluar (Halaman ini)
            </span>
            <p className="text-2xl font-bold text-amber-700 mt-1 font-mono">
              {totalPcsHalaman} <span className="text-xs font-normal text-slate-500">pcs / unit</span>
            </p>
            <span className="text-[11px] text-amber-600 font-medium">Obat keluar ke pelanggan</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Nilai Penjualan (Halaman ini)
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1 font-mono">
              {formatRupiah(totalOmzetHalaman)}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Penerimaan kasir</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar Pencarian & Rentang Tanggal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Input Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari No. Transaksi, Nama Obat, atau Pelanggan..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Tanggal Dari */}
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

        {/* Reset Filter Bar */}
        {(search || startDate || endDate) && (
          <div className="flex justify-end pt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Reset Filter Tanggal & Pencarian
            </button>
          </div>
        )}
      </div>

      {/* Tabel Rincian Barang Keluar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-4 w-40">No. Transaksi</th>
                <th className="p-4 w-44">Tanggal & Waktu</th>
                <th className="p-4 w-48">Pelanggan & Kasir</th>
                <th className="p-4">Rincian Obat / Barang Keluar</th>
                <th className="p-4 text-center w-28">Total Keluar</th>
                <th className="p-4 text-right w-36">Total Penjualan</th>
                <th className="p-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Memuat riwayat barang keluar...</span>
                  </td>
                </tr>
              ) : transaksiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <ArrowUpFromLine className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada transaksi barang keluar ditemukan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || startDate || endDate
                        ? "Coba sesuaikan kata kunci pencarian atau rentang tanggal."
                        : "Lakukan transaksi penjualan obat di Terminal Kasir (POS) untuk mencatat barang keluar."}
                    </p>
                  </td>
                </tr>
              ) : (
                transaksiList.map((trx) => {
                  const totalPcs = trx.items?.reduce((acc, i) => acc + i.qty, 0) || 0;
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {trx.no_transaksi}
                      </td>

                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {formatTanggalWaktu(trx.tanggal)}
                      </td>

                      <td className="p-4 text-slate-700">
                        <div className="font-semibold text-emerald-800">
                          {trx.nama_pelanggan || "Umum"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Kasir: {trx.user?.nama || "Kasir"}
                        </div>
                      </td>

                      <td className="p-4 text-slate-700">
                        <div className="space-y-1">
                          {trx.items?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                              <span className="font-medium text-slate-800 truncate">
                                {item.nama_barang}
                              </span>
                              <span className="font-mono text-amber-700 font-bold whitespace-nowrap bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                {item.qty} pcs
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className="font-mono font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs">
                          {totalPcs} pcs
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(trx.grand_total)}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrx(trx);
                            setModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Lihat & Cetak Struk"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Menampilkan {transaksiList.length} dari total {total} transaksi barang keluar
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

      {/* Modal Cetak Struk */}
      {selectedTrx && (
        <ModalCetakStruk
          transaksiList={[selectedTrx]}
          pengaturan={pengaturan}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
