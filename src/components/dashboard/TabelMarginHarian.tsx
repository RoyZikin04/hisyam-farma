"use client";

import React from "react";
import {
  TrendingUp,
  Percent,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  FileSpreadsheet,
  Calendar,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { MarginHarianItem } from "@/services/dashboard";

interface TabelMarginHarianProps {
  data: MarginHarianItem[];
  ringkasan?: {
    totalOmzet: number;
    totalHpp: number;
    totalLabaKotor: number;
    rataRataMarginPersen: number;
    totalBarangKeluarQty: number;
    totalBarangMasukQty: number;
    totalPengadaanRp: number;
  };
  startDate?: string;
  endDate?: string;
}

export default function TabelMarginHarian({
  data,
  ringkasan,
  startDate,
  endDate,
}: TabelMarginHarianProps) {
  // Handler Unduh Laporan Transaksi & Margin Excel
  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    window.open(`/api/transaksi/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header Widget */}
      <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Laporan Margin & Mutasi Barang Per Tanggal</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian omzet, modal pokok (HPP), margin keuntungan, dan mutasi keluar/masuk harian
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs"
          title="Ekspor Laporan Transaksi & Margin Lengkap ke Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Unduh Laporan Excel</span>
        </button>
      </div>

      {/* Tabel Rincian Harian */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="p-3.5 pl-5">Tanggal</th>
              <th className="p-3.5 text-center">Struk POS</th>
              <th className="p-3.5 text-right">Omzet Penjualan</th>
              <th className="p-3.5 text-right">Modal Pokok (HPP)</th>
              <th className="p-3.5 text-right">Laba Kotor (Profit)</th>
              <th className="p-3.5 text-center">Margin %</th>
              <th className="p-3.5 text-center">Barang Keluar</th>
              <th className="p-3.5 text-right pr-5">Restock Masuk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  Tidak ada data transaksi pada rentang filter tanggal ini.
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const hasTrx = row.omzet > 0 || row.pengadaan_rp > 0;
                return (
                  <tr
                    key={row.tanggal}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !hasTrx ? "opacity-60 bg-slate-50/30" : ""
                    }`}
                  >
                    {/* Tanggal */}
                    <td className="p-3.5 pl-5 font-semibold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{row.label}</span>
                      </div>
                    </td>

                    {/* Struk Penjualan */}
                    <td className="p-3.5 text-center font-mono">
                      {row.jumlah_transaksi > 0 ? (
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                          {row.jumlah_transaksi} trx
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Omzet Penjualan */}
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {row.omzet > 0 ? formatRupiah(row.omzet) : <span className="text-slate-300">Rp 0</span>}
                    </td>

                    {/* HPP */}
                    <td className="p-3.5 text-right font-mono text-slate-600 whitespace-nowrap">
                      {row.hpp > 0 ? formatRupiah(row.hpp) : <span className="text-slate-300">Rp 0</span>}
                    </td>

                    {/* Laba Kotor */}
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      {row.laba_kotor > 0 ? (
                        formatRupiah(row.laba_kotor)
                      ) : row.laba_kotor < 0 ? (
                        <span className="text-rose-600">{formatRupiah(row.laba_kotor)}</span>
                      ) : (
                        <span className="text-slate-300">Rp 0</span>
                      )}
                    </td>

                    {/* Margin Persen */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {row.omzet > 0 ? (
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] border ${
                            row.margin_persen >= 25
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : row.margin_persen >= 15
                              ? "bg-teal-50 text-teal-800 border-teal-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {row.margin_persen.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Barang Keluar (Qty) */}
                    <td className="p-3.5 text-center font-mono">
                      {row.barang_keluar_qty > 0 ? (
                        <span className="inline-flex items-center gap-1 text-slate-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">
                          <ArrowUpFromLine className="w-3 h-3 text-amber-600" />
                          <span>{row.barang_keluar_qty} pcs</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Restock Masuk (Nilai Rp & Qty) */}
                    <td className="p-3.5 text-right pr-5 font-mono whitespace-nowrap">
                      {row.pengadaan_rp > 0 ? (
                        <div>
                          <span className="text-blue-700 font-bold">
                            {formatRupiah(row.pengadaan_rp)}
                          </span>
                          <span className="block text-[10.5px] text-slate-400">
                            ({row.barang_masuk_qty} pcs)
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Baris Total Ringkasan (Footer) */}
          {ringkasan && data.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="p-4 pl-5">TOTAL PERIODE</td>
                <td className="p-4 text-center font-mono">
                  {data.reduce((acc, r) => acc + r.jumlah_transaksi, 0)} trx
                </td>
                <td className="p-4 text-right font-mono text-slate-900">
                  {formatRupiah(ringkasan.totalOmzet)}
                </td>
                <td className="p-4 text-right font-mono text-slate-600">
                  {formatRupiah(ringkasan.totalHpp)}
                </td>
                <td className="p-4 text-right font-mono text-emerald-800 text-sm">
                  {formatRupiah(ringkasan.totalLabaKotor)}
                </td>
                <td className="p-4 text-center font-mono">
                  <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs">
                    {ringkasan.rataRataMarginPersen.toFixed(1)}%
                  </span>
                </td>
                <td className="p-4 text-center font-mono text-slate-800">
                  {ringkasan.totalBarangKeluarQty} pcs
                </td>
                <td className="p-4 text-right pr-5 font-mono text-blue-800">
                  <div>{formatRupiah(ringkasan.totalPengadaanRp)}</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    ({ringkasan.totalBarangMasukQty} pcs)
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
