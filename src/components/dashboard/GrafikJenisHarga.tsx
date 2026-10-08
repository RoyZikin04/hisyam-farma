"use client";

import React, { useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import "./ChartConfig";
import { JenisHargaStat } from "@/services/dashboard";
import { formatRupiah } from "@/lib/format";

interface GrafikJenisHargaProps {
  data: JenisHargaStat;
}

export default function GrafikJenisHarga({ data }: GrafikJenisHargaProps) {

  const total = data.BEBAS + data.RESEP + data.GROSIR;

  const chartData = {
    labels: ["Harga Bebas", "Harga Resep", "Harga Grosir"],
    datasets: [
      {
        data: [data.BEBAS, data.RESEP, data.GROSIR],
        backgroundColor: [
          "#10b981", // emerald-500
          "#0d9488", // teal-600
          "#475569", // slate-600
        ],
        hoverBackgroundColor: [
          "#059669",
          "#0f766e",
          "#334155",
        ],
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          font: { size: 11 },
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const persen = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
            return ` ${label}: ${formatRupiah(value)} (${persen}%)`;
          },
        },
      },
    },
    cutout: "68%",
  };

  return (
    <div className="w-full h-72 flex flex-col items-center justify-center relative">
      {total === 0 ? (
        <div className="text-center text-slate-400 text-xs">
          Belum ada penjualan dalam periode ini.
        </div>
      ) : (
        <>
          <Doughnut data={chartData} options={options} />
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Penjualan
            </span>
            <span className="text-sm font-bold text-slate-800 font-mono">
              {formatRupiah(total)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
