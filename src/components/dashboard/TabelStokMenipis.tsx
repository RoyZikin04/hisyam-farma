"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ArrowDownToLine, PackageX } from "lucide-react";
import { BarangMenipisItem } from "@/services/dashboard";
import { formatRupiah } from "@/lib/format";

interface TabelStokMenipisProps {
  items: BarangMenipisItem[];
  totalCount: number;
}

export default function TabelStokMenipis({ items, totalCount }: TabelStokMenipisProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header Widget */}
      <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Peringatan Stok Obat Menipis</span>
              {totalCount > 0 && (
                <span className="text-xs bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                  {totalCount} Barang
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Barang aktif dengan sisa kuantitas di bawah ambang batas (≤ 10)
            </p>
          </div>
        </div>

        <Link
          href="/transaksi/masuk"
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>Restock Masuk</span>
        </Link>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 font-semibold text-slate-500">
              <th className="p-3.5 pl-5">Kode</th>
              <th className="p-3.5">Nama Obat / Barang</th>
              <th className="p-3.5 text-center">Sisa Stok</th>
              <th className="p-3.5 text-right">Harga Pokok (HPP)</th>
              <th className="p-3.5 text-right">Harga Bebas</th>
              <th className="p-3.5 text-center pr-5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    ✓
                  </div>
                  <p className="font-semibold text-slate-700">Semua Stok Aman</p>
                  <p className="text-[11px] text-slate-400">
                    Tidak ada barang dengan stok di bawah ambang batas 10 unit.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((b) => {
                const isHabis = b.stok <= 0;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 pl-5 font-mono text-slate-600 font-semibold">
                      {b.kode_barang}
                    </td>
                    <td className="p-3.5 font-medium text-slate-800">
                      {b.nama_barang}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                          isHabis
                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {isHabis && <PackageX className="w-3 h-3" />}
                        <span>
                          {b.stok} {b.satuan}
                        </span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {formatRupiah(b.harga_pokok)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                      {formatRupiah(b.harga_bebas)}
                    </td>
                    <td className="p-3.5 text-center pr-5">
                      <Link
                        href={`/transaksi/masuk`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                      >
                        <span>Pengadaan</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
