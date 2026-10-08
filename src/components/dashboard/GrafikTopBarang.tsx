"use client";

import React, { useEffect } from "react";
import { Bar } from "react-chartjs-2";
import "./ChartConfig";
import { TopBarangStat } from "@/services/dashboard";
import { formatRupiah } from "@/lib/format";

interface GrafikTopBarangProps {
  data: TopBarangStat[];
}

export default function GrafikTopBarang({ data }: GrafikTopBarangProps) {

  const chartData = {
    labels: data.map((d) => (d.nama_barang.length > 20 ? d.nama_barang.substring(0, 18) + "..." : d.nama_barang)),
    datasets: [
      {
        label: "Qty Terjual",
        data: data.map((d) => d.total_qty),
        backgroundColor: "rgba(16, 185, 129, 0.85)", // emerald-500
        hoverBackgroundColor: "rgba(5, 150, 105, 1)",
        borderRadius: 6,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
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
          title: function (items: any) {
            if (!items.length) return "";
            const idx = items[0].dataIndex;
            return data[idx]?.nama_barang || "";
          },
          label: function (context: any) {
            const idx = context.dataIndex;
            const item = data[idx];
            return [
              ` Terjual: ${item?.total_qty || 0} unit`,
              ` Omzet: ${formatRupiah(item?.total_omzet || 0)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(226, 232, 240, 0.6)",
        },
        ticks: {
          font: { size: 10 },
          color: "#64748b",
          stepSize: 1,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 11 },
          color: "#334155",
        },
      },
    },
  };

  return (
    <div className="w-full h-72">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-slate-400 text-xs">
          Belum ada data barang terjual dalam periode ini.
        </div>
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  );
}
