"use client";

import React, { useState, useEffect } from "react";
import { Printer, X, FileText, CheckCircle2 } from "lucide-react";
import StrukView, {
  TransaksiData,
  PengaturanTokoData,
} from "./StrukView";

interface ModalCetakStrukProps {
  transaksiList: TransaksiData[];
  pengaturan?: PengaturanTokoData;
  isOpen: boolean;
  onClose: () => void;
  defaultUkuran?: "58mm" | "80mm" | "A4";
}

export default function ModalCetakStruk({
  transaksiList,
  pengaturan,
  isOpen,
  onClose,
  defaultUkuran = "80mm",
}: ModalCetakStrukProps) {
  const [ukuran, setUkuran] = useState<"58mm" | "80mm" | "A4">(defaultUkuran);

  useEffect(() => {
    if (pengaturan?.ukuran_kertas) {
      setUkuran(pengaturan.ukuran_kertas as any);
    } else if (defaultUkuran) {
      setUkuran(defaultUkuran);
    }
  }, [pengaturan, defaultUkuran]);

  // Handle keyboard shortcut Esc untuk tutup
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || transaksiList.length === 0) return null;

  const isBatch = transaksiList.length > 1;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-hidden">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header (No Print) */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>
                  {isBatch
                    ? `Cetak Batch: ${transaksiList.length} Struk Sekaligus`
                    : "Pratinjau & Cetak Struk"}
                </span>
                {isBatch && (
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Massal
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Pilih ukuran kertas sesuai printer kasir atau faktur A4
              </p>
            </div>
          </div>

          {/* Opsi Ukuran Kertas */}
          <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => setUkuran("58mm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ukuran === "58mm"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              58mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setUkuran("80mm")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ukuran === "80mm"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              80mm Thermal
            </button>
            <button
              type="button"
              onClick={() => setUkuran("A4")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                ukuran === "A4"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A4 Faktur
            </button>
          </div>

          {/* Tombol Aksi Cetak & Batal */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 sm:px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-700/30 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex flex-col items-center">
          {/* Petunjuk Batch */}
          {isBatch && (
            <div className="w-full max-w-xl mb-4 p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 flex items-center justify-between no-print">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  <strong>{transaksiList.length} struk</strong> siap dicetak berurutan
                  (halaman otomatis dipisah per struk).
                </span>
              </span>
            </div>
          )}

          {/* Container Area Cetak Resmi */}
          <div
            id="area-cetak-struk"
            className="w-full flex flex-col items-center gap-6"
          >
            {transaksiList.map((trx, index) => (
              <div
                key={trx.id || index}
                className="w-full flex justify-center struk-container"
              >
                <StrukView
                  transaksi={trx}
                  pengaturan={pengaturan}
                  ukuran={ukuran}
                  isBatch={index < transaksiList.length - 1}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400 no-print">
          <span>
            Tips: Gunakan opsi printer "Save to PDF" jika ingin menyimpan struk dalam berkas digital.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 hover:text-slate-200 cursor-pointer"
          >
            Tutup (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
