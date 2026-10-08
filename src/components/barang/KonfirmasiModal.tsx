"use client";

import { AlertTriangle, X } from "lucide-react";

interface KonfirmasiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  judul: string;
  pesan: string;
  tipe?: "bahaya" | "info";
  tombolTeks?: string;
  loading?: boolean;
}

export default function KonfirmasiModal({
  isOpen,
  onClose,
  onConfirm,
  judul,
  pesan,
  tipe = "bahaya",
  tombolTeks = "Ya, Lanjutkan",
  loading = false,
}: KonfirmasiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`p-3 rounded-2xl ${
                tipe === "bahaya"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-2">{judul}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">{pesan}</p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                tipe === "bahaya"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/30"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{tombolTeks}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
