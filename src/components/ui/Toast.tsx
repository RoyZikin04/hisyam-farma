"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";

interface ToastProps {
  tipe: "sukses" | "error";
  pesan: string;
  onTutup: () => void;
}

export default function Toast({ tipe, pesan, onTutup }: ToastProps) {
  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm max-w-md transition-all animate-in fade-in slide-in-from-top-4 ${
        tipe === "sukses"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-rose-50 border-rose-200 text-rose-800"
      }`}
    >
      {tipe === "sukses" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
      )}
      <span className="flex-1 font-medium">{pesan}</span>
      <button
        type="button"
        onClick={onTutup}
        className="p-1 hover:bg-black/5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
