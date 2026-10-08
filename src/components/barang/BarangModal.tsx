"use client";

import { useState, useEffect } from "react";
import { X, Calculator, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { hitungSemuaHarga } from "@/services/pricing";
import { formatRupiah } from "@/lib/format";

export interface BarangItem {
  id?: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
  harga_beli: number;
  diskon_persen: number;
  ppn_persen: number;
  harga_pokok: number;
  harga_bebas: number;
  harga_resep: number;
  harga_grosir: number;
  aktif?: boolean;
}

interface BarangModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pesan: string) => void;
  barangEdit: BarangItem | null;
}

export default function BarangModal({
  isOpen,
  onClose,
  onSuccess,
  barangEdit,
}: BarangModalProps) {
  const [formData, setFormData] = useState<BarangItem>({
    kode_barang: "",
    nama_barang: "",
    satuan: "Strip",
    stok: 0,
    harga_beli: 0,
    diskon_persen: 0,
    ppn_persen: 11,
    harga_pokok: 0,
    harga_bebas: 0,
    harga_resep: 0,
    harga_grosir: 0,
  });

  // State untuk kalkulator harga
  const [markupBebas, setMarkupBebas] = useState(25);
  const [markupResep, setMarkupResep] = useState(35);
  const [markupGrosir, setMarkupGrosir] = useState(15);
  const [pembulatan, setPembulatan] = useState(100);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ambil konfigurasi markup toko dari API pengaturan saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      fetch("/api/pengaturan")
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setMarkupBebas(data.default_markup_bebas ?? 25);
            setMarkupResep(data.default_markup_resep ?? 35);
            setMarkupGrosir(data.default_markup_grosir ?? 15);
            setPembulatan(data.pembulatan ?? 100);
          }
        })
        .catch((err) => console.error("Gagal memuat pengaturan markup:", err));

      if (barangEdit) {
        setFormData({ ...barangEdit });
      } else {
        // Form baru
        setFormData({
          kode_barang: "",
          nama_barang: "",
          satuan: "Strip",
          stok: 0,
          harga_beli: 0,
          diskon_persen: 0,
          ppn_persen: 11,
          harga_pokok: 0,
          harga_bebas: 0,
          harga_resep: 0,
          harga_grosir: 0,
        });
      }
      setErrorMsg(null);
    }
  }, [isOpen, barangEdit]);

  // Fungsi kalkulasi real-time memanggil pricing service
  const jalankanKalkulator = (
    beli: number,
    diskon: number,
    ppn: number,
    mBebas: number,
    mResep: number,
    mGrosir: number,
    bulat: number
  ) => {
    const hasil = hitungSemuaHarga({
      hargaBeli: beli,
      diskonPersen: diskon,
      ppnPersen: ppn,
      markupBebasPersen: mBebas,
      markupResepPersen: mResep,
      markupGrosirPersen: mGrosir,
      pembulatan: bulat,
    });

    setFormData((prev) => ({
      ...prev,
      harga_pokok: hasil.hargaPokok,
      harga_bebas: hasil.hargaBebas,
      harga_resep: hasil.hargaResep,
      harga_grosir: hasil.hargaGrosir,
    }));
  };

  // Handler perubahan input harga beli / diskon / ppn
  const handleBeliChange = (val: number) => {
    setFormData((prev) => ({ ...prev, harga_beli: val }));
    jalankanKalkulator(val, formData.diskon_persen, formData.ppn_persen, markupBebas, markupResep, markupGrosir, pembulatan);
  };

  const handleDiskonChange = (val: number) => {
    setFormData((prev) => ({ ...prev, diskon_persen: val }));
    jalankanKalkulator(formData.harga_beli, val, formData.ppn_persen, markupBebas, markupResep, markupGrosir, pembulatan);
  };

  const handlePpnChange = (val: number) => {
    setFormData((prev) => ({ ...prev, ppn_persen: val }));
    jalankanKalkulator(formData.harga_beli, formData.diskon_persen, val, markupBebas, markupResep, markupGrosir, pembulatan);
  };

  const handleMarkupChange = (jenis: "bebas" | "resep" | "grosir", val: number) => {
    let mb = markupBebas;
    let mr = markupResep;
    let mg = markupGrosir;
    if (jenis === "bebas") { setMarkupBebas(val); mb = val; }
    if (jenis === "resep") { setMarkupResep(val); mr = val; }
    if (jenis === "grosir") { setMarkupGrosir(val); mg = val; }
    jalankanKalkulator(formData.harga_beli, formData.diskon_persen, formData.ppn_persen, mb, mr, mg, pembulatan);
  };

  const handlePembulatanChange = (val: number) => {
    setPembulatan(val);
    jalankanKalkulator(formData.harga_beli, formData.diskon_persen, formData.ppn_persen, markupBebas, markupResep, markupGrosir, val);
  };

  // Buat kode barang otomatis jika kosong
  const generateKodeBarang = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, kode_barang: `BRG-${randomNum}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.kode_barang.trim()) {
      setErrorMsg("Kode barang wajib diisi.");
      return;
    }
    if (!formData.nama_barang.trim()) {
      setErrorMsg("Nama barang wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const isEdit = !!barangEdit?.id;
      const url = isEdit ? `/api/barang/${barangEdit.id}` : "/api/barang";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || "Gagal menyimpan data barang.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess(json.message || "Data barang berhasil disimpan.");
      onClose();
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calculator className="w-5 h-5 text-emerald-200" />
            <h3 className="text-lg font-bold">
              {barangEdit ? "Ubah Data Barang" : "Tambah Barang Baru"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Isi */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bagian 1: Identitas Barang */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Identitas & Satuan Barang
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Barang <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.kode_barang}
                    onChange={(e) =>
                      setFormData({ ...formData, kode_barang: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: BRG-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                  />
                  {!barangEdit && (
                    <button
                      type="button"
                      onClick={generateKodeBarang}
                      title="Generate Kode Otomatis"
                      className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-medium transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_barang}
                  onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                  placeholder="Nama obat/barang..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Satuan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                >
                  <option value="Strip">Strip</option>
                  <option value="Botol">Botol</option>
                  <option value="Box">Box</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Tube">Tube</option>
                  <option value="Sachet">Sachet</option>
                  <option value="Kapsul">Kapsul</option>
                  <option value="Ampul">Ampul</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bagian 2: Stok & Harga Beli (Kalkulator Terpadu) */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <span>2. Kalkulator Harga Pokok (HPP) Real-Time</span>
              </h4>
              <button
                type="button"
                onClick={() =>
                  jalankanKalkulator(
                    formData.harga_beli,
                    formData.diskon_persen,
                    formData.ppn_persen,
                    markupBebas,
                    markupResep,
                    markupGrosir,
                    pembulatan
                  )
                }
                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Hitung Ulang</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stok Awal
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stok}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) =>
                    setFormData({ ...formData, stok: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Harga Beli (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.harga_beli}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleBeliChange(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diskon Beli (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.diskon_persen}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleDiskonChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  PPN (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.ppn_persen}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handlePpnChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Hasil HPP */}
            <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
              <span>
                Rumus HPP: Beli - Diskon + PPN =
              </span>
              <span className="text-base font-bold text-emerald-700 font-mono">
                {formatRupiah(formData.harga_pokok)}
              </span>
            </div>
          </div>

          {/* Bagian 3: Markup & Harga Jual (Bebas, Resep, Grosir) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Harga Jual & Opsi Pembulatan (Dapat Ditimpa Manual)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Pembulatan:</span>
                <select
                  value={pembulatan}
                  onChange={(e) => handlePembulatanChange(parseInt(e.target.value, 10))}
                  className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  <option value={1}>1</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Harga Bebas */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Harga Bebas</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">Markup:</span>
                    <input
                      type="number"
                      min="0"
                      value={markupBebas}
                      onChange={(e) => handleMarkupChange("bebas", parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-bold"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.harga_bebas}
                  onChange={(e) =>
                    setFormData({ ...formData, harga_bebas: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 text-right">
                  {formatRupiah(formData.harga_bebas)}
                </p>
              </div>

              {/* Harga Resep */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Harga Resep</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">Markup:</span>
                    <input
                      type="number"
                      min="0"
                      value={markupResep}
                      onChange={(e) => handleMarkupChange("resep", parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-center text-xs font-bold"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.harga_resep}
                  onChange={(e) =>
                    setFormData({ ...formData, harga_resep: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 text-right">
                  {formatRupiah(formData.harga_resep)}
                </p>
              </div>

              {/* Harga Grosir */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">Harga Grosir</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-emerald-600">Markup:</span>
                    <input
                      type="number"
                      min="0"
                      value={markupGrosir}
                      onChange={(e) => handleMarkupChange("grosir", parseFloat(e.target.value) || 0)}
                      className="w-12 px-1 py-0.5 bg-white border border-emerald-200 rounded text-center text-xs font-bold text-emerald-800"
                    />
                    <span className="text-xs text-emerald-600">%</span>
                  </div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={formData.harga_grosir}
                  onChange={(e) =>
                    setFormData({ ...formData, harga_grosir: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-sm font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-emerald-600 font-medium text-right">
                  {formatRupiah(formData.harga_grosir)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Tombol Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{barangEdit ? "Simpan Perubahan" : "Simpan Barang"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
