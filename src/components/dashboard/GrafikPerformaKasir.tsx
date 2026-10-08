"use client";

import React, { useEffect } from "react";
import { Bar } from "react-chartjs-2";
import "./ChartConfig";
import { KasirStat } from "@/services/dashboard";
import { formatRupiah } from "@/lib/format";

interface GrafikPerformaKasirProps {
  data: KasirStat[];
}

export default function GrafikPerformaKasir({ data }: GrafikPerformaKasirProps) {

  const chartData = {
    labels: data.map((d) => d.nama),
    datasets: [
      {
        label: "Total Omzet (Rp)",
        data: data.map((d) => d.total_omzet),
        backgroundColor: "rgba(13, 148, 136, 0.8)", // teal-600
        hoverBackgroundColor: "rgba(15, 118, 110, 1)",
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: function (context: any) {
            const idx = context.dataIndex;
            const item = data[idx];
            return [
              ` Omzet: ${formatRupiah(item?.total_omzet || 0)}`,
              ` Transaksi: ${item?.jumlah_transaksi || 0} struk`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, color: "#334155" },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(226, 232, 240, 0.6)" },
        ticks: {
          font: { size: 10 },
          color: "#64748b",
          callback: function (val: any) {
            if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
            if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
            return `Rp ${val}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-72">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
          Belum ada aktivitas kasir pada periode ini.
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}
