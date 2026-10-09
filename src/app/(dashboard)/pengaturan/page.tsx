"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Store,
  Percent,
  Receipt,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Printer,
  Coins,
} from "lucide-react";
import Toast from "@/components/ui/Toast";

interface PengaturanData {
  nama_toko: string;
  alamat: string;
  telepon: string;
  footer_struk: string;
  default_markup_bebas: number;
  default_markup_resep: number;
  default_markup_grosir: number;
  pembulatan: number;
  ukuran_kertas: "58mm" | "80mm" | "A4";
}

export default function PengaturanPage() {
  const [form, setForm] = useState<PengaturanData>({
    nama_toko: "",
    alamat: "",
    telepon: "",
    footer_struk: "",
    default_markup_bebas: 25,
    default_markup_resep: 35,
    default_markup_grosir: 15,
    pembulatan: 100,
    ukuran_kertas: "80mm",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Ambil data pengaturan saat load
  useEffect(() => {
    fetch("/api/pengaturan")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat pengaturan");
        return res.json();
      })
      .then((data) => {
        setForm({
          nama_toko: data.nama_toko || "",
          alamat: data.alamat || "",
          telepon: data.telepon || "",
          footer_struk: data.footer_struk || "",
          default_markup_bebas: data.default_markup_bebas ?? 25,
          default_markup_resep: data.default_markup_resep ?? 35,
          default_markup_grosir: data.default_markup_grosir ?? 15,
          pembulatan: data.pembulatan ?? 100,
          ukuran_kertas: data.ukuran_kertas || "80mm",
        });
      })
      .catch((err) => {
        console.error(err);
        setToast({ tipe: "error", pesan: "Gagal memuat data pengaturan toko." });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal menyimpan pengaturan." });
        return;
      }

      setToast({ tipe: "sukses", pesan: "Pengaturan toko dan preferensi POS berhasil disimpan." });
    } catch {
      setToast({ tipe: "error", pesan: "Terjadi kesalahan jaringan saat menyimpan." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Memuat pengaturan toko...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notifikasi */}
      {toast && <Toast tipe={toast.tipe} pesan={toast.pesan} onClose={() => setToast(null)} />}

      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-emerald-600" />
          <span>Pengaturan Toko & Preferensi POS</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi identitas apotek, parameter markup harga otomatis, aturan pembulatan, dan format struk cetak.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BAGIAN 1: IDENTITAS TOKO / APOTEK */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Identitas & Profil Toko</h2>
              <p className="text-xs text-slate-400">
                Informasi ini akan dicetak pada kop struk belanja dan faktur penjualan resmi.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Apotek / Toko <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nama_toko}
                onChange={(e) => setForm({ ...form, nama_toko: e.target.value })}
                placeholder="Contoh: Apotek & Toko Berkah Sehat"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Contoh: Jl. Kesehatan Raya No. 45, Kebayoran Baru, Jakarta Selatan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.telepon}
                onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Footer Struk (Pesan Bawah)
              </label>
              <input
                type="text"
                value={form.footer_struk}
                onChange={(e) => setForm({ ...form, footer_struk: e.target.value })}
                placeholder="Contoh: Semoga lekas sembuh! Terima kasih atas kunjungan Anda."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2: DEFAULT MARKUP HARGA JUAL */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Default Markup Kalkulator Harga Jual
              </h2>
              <p className="text-xs text-slate-400">
                Nilai persentase margin keuntungan standar saat menginput atau mengkalkulasi harga jual obat baru.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Markup Harga Bebas (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.default_markup_bebas}
                  onChange={(e) =>
                    setForm({ ...form, default_markup_bebas: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Penjualan umum tanpa resep dokter.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Markup Harga Resep (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.default_markup_resep}
                  onChange={(e) =>
                    setForm({ ...form, default_markup_resep: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Penjualan obat beretiket atau racikan.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Markup Harga Grosir (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  required
                  value={form.default_markup_grosir}
                  onChange={(e) =>
                    setForm({ ...form, default_markup_grosir: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Penjualan dalam volume besar / toko mitra.</p>
            </div>
          </div>
        </div>

        {/* BAGIAN 3: ATURAN PEMBULATAN & KERTAS STRUK */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">
                Aturan Pembulatan Rupiah & Ukuran Kertas Struk
              </h2>
              <p className="text-xs text-slate-400">
                Standar presisi harga kasir dan format default saat membuka dialog cetak.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Opsi Pembulatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Kelipatan Pembulatan Harga Jual
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 1, label: "Rp 1 (Murni)", desc: "Tanpa pembulatan" },
                  { val: 50, label: "Rp 50", desc: "Kelipatan 50" },
                  { val: 100, label: "Rp 100 (Disarankan)", desc: "Kelipatan 100" },
                  { val: 500, label: "Rp 500", desc: "Kelipatan 500" },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setForm({ ...form, pembulatan: item.val })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      form.pembulatan === item.val
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div className="font-bold text-xs text-slate-800">{item.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Opsi Ukuran Kertas */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Default Ukuran Kertas Cetak Struk
              </label>
              <div className="space-y-2">
                {[
                  {
                    val: "80mm",
                    label: "Thermal 80mm (Standar POS Kasir)",
                    desc: "Ukuran standar mesin printer kasir apotek",
                  },
                  {
                    val: "58mm",
                    label: "Thermal 58mm (Kompak / Portable)",
                    desc: "Format ringkas untuk printer mini / bluetooth",
                  },
                  {
                    val: "A4",
                    label: "Kertas A4 (Faktur Resmi / Nota Surat)",
                    desc: "Format dokumen formal dengan tanda tangan",
                  },
                ].map((kertas) => (
                  <button
                    key={kertas.val}
                    type="button"
                    onClick={() =>
                      setForm({ ...form, ukuran_kertas: kertas.val as any })
                    }
                    className={`w-full p-2.5 px-3 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      form.ukuran_kertas === kertas.val
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800">{kertas.label}</div>
                      <div className="text-[10px] text-slate-400">{kertas.desc}</div>
                    </div>
                    {form.ukuran_kertas === kertas.val && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Form */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Simpan Pengaturan Toko</span>
          </button>
        </div>
      </form>
    </div>
  );
}
