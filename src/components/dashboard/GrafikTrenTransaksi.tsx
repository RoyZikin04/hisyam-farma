"use client";

import React, { useEffect } from "react";
import { Line } from "react-chartjs-2";
import "./ChartConfig";
import { TrenItem } from "@/services/dashboard";
import { formatRupiah } from "@/lib/format";

interface GrafikTrenTransaksiProps {
  data: TrenItem[];
}

export default function GrafikTrenTransaksi({ data }: GrafikTrenTransaksiProps) {

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: "Penjualan POS (Keluar)",
        data: data.map((d) => d.penjualan),
        borderColor: "#10b981", // emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#059669",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Pengadaan Restock (Masuk)",
        data: data.map((d) => d.pengadaan),
        borderColor: "#0284c7", // sky-600
        backgroundColor: "rgba(2, 132, 199, 0.08)",
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0.35,
        pointBackgroundColor: "#0369a1",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 11,
            family: "inherit",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleFont: { size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            const value = context.parsed.y || 0;
            return ` ${label}: ${formatRupiah(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
          color: "#64748b",
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(226, 232, 240, 0.7)",
        },
        ticks: {
          font: { size: 10 },
          color: "#64748b",
          callback: function (val: any) {
            if (val >= 1000000) {
              return `Rp ${(val / 1000000).toFixed(1)}jt`;
            }
            if (val >= 1000) {
              return `Rp ${(val / 1000).toFixed(0)}rb`;
            }
            return `Rp ${val}`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full h-72">
      <Line data={chartData} options={options} />
    </div>
  );
}
