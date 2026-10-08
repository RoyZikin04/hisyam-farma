"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Store,
  Layers,
  ShoppingBag,
  Package,
  Award,
  Users,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { DashboardStatsResult } from "@/services/dashboard";
import GrafikTrenTransaksi from "@/components/dashboard/GrafikTrenTransaksi";
import GrafikJenisHarga from "@/components/dashboard/GrafikJenisHarga";
import GrafikTopBarang from "@/components/dashboard/GrafikTopBarang";
import GrafikPerformaKasir from "@/components/dashboard/GrafikPerformaKasir";
import TabelStokMenipis from "@/components/dashboard/TabelStokMenipis";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState<"7hari" | "30hari" | "bulan_ini" | "custom">("7hari");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("periode", periode);
      if (periode === "custom" && startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }

      const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Gagal memuat statistik dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [periode, startDate, endDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <Store className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Dashboard & Analitik Apotek
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau arus kas penjualan, mutasi pengadaan, estimasi profit, dan ketersediaan stok obat real-time.
          </p>
        </div>

        {/* Filter Periode & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setPeriode("7hari")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periode === "7hari"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriode("30hari")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periode === "30hari"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriode("bulan_ini")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periode === "bulan_ini"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriode("custom")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periode === "custom"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              Kustom
            </button>
          </div>

          {periode === "custom" && (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 px-2 border border-slate-200 rounded-xl text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-700 outline-none"
              />
            </div>
          )}

          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Kartu Statistik Utama (KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Omzet Hari Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatRupiah(stats?.omzetHariIni || 0)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>● Penjualan POS hari ini</span>
          </p>
        </div>

        {/* KPI 2: Omzet Bulan Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Bulan Ini
            </span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {formatRupiah(stats?.omzetBulanIni || 0)}
          </h3>
          <p className="text-[11px] text-teal-600 font-medium mt-1 flex items-center gap-1">
            <span>● Total penerimaan bulan berjalan</span>
          </p>
        </div>

        {/* KPI 3: Estimasi Laba Kotor */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Laba Kotor (Profit)
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-700 mt-2 font-mono">
            {formatRupiah(stats?.estimasiProfitBulanIni || 0)}
          </h3>
          <p className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <span>● Omzet dikurangi HPP obat</span>
          </p>
        </div>

        {/* KPI 4: Transaksi Hari Ini */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Transaksi Hari Ini
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            {stats?.transaksiHariIni || 0} <span className="text-sm font-sans font-medium text-slate-500">Struk</span>
          </h3>
          <p className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
            <span>● Pelanggan kasir terlayani</span>
          </p>
        </div>

        {/* KPI 5: Peringatan Stok Menipis */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stok Menipis
            </span>
            <div className={`p-2 rounded-xl ${
              (stats?.stokMenipisCount || 0) > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-500"
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold mt-2 font-mono ${
            (stats?.stokMenipisCount || 0) > 0 ? "text-rose-600" : "text-slate-900"
          }`}>
            {stats?.stokMenipisCount || 0} <span className="text-sm font-sans font-medium text-slate-500">Barang</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
            <span>● Sisa kuantitas ≤ 10 unit</span>
          </p>
        </div>
      </div>

      {/* Grid Grafik Visualisasi 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik 1: Tren Transaksi Penjualan vs Pengadaan (Col Span 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Tren Penjualan POS vs Pengadaan Restock</span>
              </h2>
              <p className="text-xs text-slate-500">
                Arus kas perbandingan omzet keluar dan belanja barang masuk
              </p>
            </div>
          </div>
          <GrafikTrenTransaksi data={stats?.trenTransaksi || []} />
        </div>

        {/* Grafik 2: Proporsi Penjualan Berdasarkan Jenis Harga */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Penjualan per Jenis Harga</span>
            </h2>
            <p className="text-xs text-slate-500">
              Proporsi omzet Harga Bebas, Resep, dan Grosir
            </p>
          </div>
          <GrafikJenisHarga
            data={
              stats?.penjualanJenisHarga || {
                BEBAS: 0,
                RESEP: 0,
                GROSIR: 0,
              }
            }
          />
        </div>

        {/* Grafik 3: Top 10 Barang Terlaris (Col Span 2) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>10 Obat & Barang Terlaris</span>
            </h2>
            <p className="text-xs text-slate-500">
              Peringkat barang berdasarkan kuantitas unit terjual
            </p>
          </div>
          <GrafikTopBarang data={stats?.topBarang || []} />
        </div>

        {/* Grafik 4: Kontribusi Performa Kasir */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Kinerja & Kontribusi Kasir</span>
            </h2>
            <p className="text-xs text-slate-500">
              Perbandingan total omzet transaksi per kasir
            </p>
          </div>
          <GrafikPerformaKasir data={stats?.performaKasir || []} />
        </div>
      </div>

      {/* Widget Peringatan Stok Menipis */}
      <TabelStokMenipis
        items={stats?.barangStokMenipis || []}
        totalCount={stats?.stokMenipisCount || 0}
      />
    </div>
  );
}
