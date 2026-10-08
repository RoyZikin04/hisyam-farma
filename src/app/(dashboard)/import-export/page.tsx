"use client";

import { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  Save,
  Calendar,
  Filter,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";

interface ValidRow {
  barisKe: number;
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
  sudahAda?: boolean;
}

interface InvalidRow {
  barisKe: number;
  kode_barang: string;
  nama_barang: string;
  alasanError: string;
}

interface PreviewData {
  totalBaris: number;
  validCount: number;
  invalidCount: number;
  validRows: ValidRow[];
  invalidRows: InvalidRow[];
}

export default function ImportExportPage() {
  const [tabAktif, setTabAktif] = useState<"import" | "export">("import");

  // State Import
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [updateJikaAda, setUpdateJikaAda] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loadingSave, setLoadingSave] = useState(false);

  // State Export
  const [exportBarangStatus, setExportBarangStatus] = useState("semua");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportTransaksiTipe, setExportTransaksiTipe] = useState("");

  // Toast
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Handler Pilih File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewData(null);
    }
  };

  // Handler Preview Upload
  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ tipe: "error", pesan: "Pilih file .xlsx atau .csv terlebih dahulu." });
      return;
    }

    setLoadingPreview(true);
    setToast(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/barang/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: data.error || "Gagal memproses pratinjau file." });
        setLoadingPreview(false);
        return;
      }

      setPreviewData(data);
      setToast({ tipe: "sukses", pesan: data.message });
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat memproses file." });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handler Simpan Data Impor ke Database
  const handleSimpanImport = async () => {
    if (!previewData || previewData.validRows.length === 0) return;

    setLoadingSave(true);
    setToast(null);

    try {
      const res = await fetch("/api/barang/import/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: previewData.validRows,
          updateJikaAda,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: data.error || "Gagal menyimpan data impor." });
        setLoadingSave(false);
        return;
      }

      setToast({ tipe: "sukses", pesan: data.message });
      setPreviewData(null);
      setSelectedFile(null);
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan server saat menyimpan data impor." });
    } finally {
      setLoadingSave(false);
    }
  };

  // Handler Download Ekspor Barang
  const handleExportBarang = () => {
    window.location.href = `/api/barang/export?status=${exportBarangStatus}`;
  };

  // Handler Download Ekspor Transaksi
  const handleExportTransaksi = () => {
    const params = new URLSearchParams();
    if (exportStartDate) params.append("startDate", exportStartDate);
    if (exportEndDate) params.append("endDate", exportEndDate);
    if (exportTransaksiTipe) params.append("tipe", exportTransaksiTipe);

    window.location.href = `/api/transaksi/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifikasi */}
      {toast && (
        <Toast
          tipe={toast.tipe}
          pesan={toast.pesan}
          onTutup={() => setToast(null)}
        />
      )}

      {/* Header Halaman */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
          <span>Manajemen Data Excel</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Unduh template, impor katalog barang dengan validasi per baris, dan ekspor data ke format .xlsx (ExcelJS).
        </p>
      </div>

      {/* Tab Navigasi */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setTabAktif("import")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            tabAktif === "import"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Impor Data Barang</span>
        </button>
        <button
          type="button"
          onClick={() => setTabAktif("export")}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            tabAktif === "export"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Data (.xlsx)</span>
        </button>
      </div>

      {/* Konten Tab 1: IMPORT */}
      {tabAktif === "import" && (
        <div className="space-y-6">
          {/* Langkah 1 & 2: Unduh Template & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1: Unduh Template */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">1. Unduh Template</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Gunakan format resmi spreadsheet agar kolom dan data barang dapat dibaca dengan tepat oleh sistem.
                </p>
              </div>
              <div className="mt-6">
                <a
                  href="/api/barang/template"
                  download
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold rounded-xl text-xs transition-colors border border-slate-200"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Unduh Template .xlsx</span>
                </a>
              </div>
            </div>

            {/* Box 2: Form Upload File & Opsi */}
            <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-1">
                2. Pilih File Excel / CSV & Pratinjau
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Pilih file yang telah diisi data. Sistem akan memvalidasi setiap baris dan menyajikan pratinjau sebelum disimpan.
              </p>

              <form onSubmit={handlePreview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Berkas Spreadsheet (.xlsx / .csv)
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-xl bg-slate-50 p-1.5"
                  />
                  {selectedFile && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-medium">
                      File terpilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="updateJikaAda"
                    checked={updateJikaAda}
                    onChange={(e) => setUpdateJikaAda(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="updateJikaAda" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Perbarui data jika kode barang sudah terdaftar di database (Update if exists)
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!selectedFile || loadingPreview}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingPreview ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Pratinjau (Preview) Data</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bagian Pratinjau (Preview) Data */}
          {previewData && (
            <div className="space-y-6 animate-in fade-in">
              {/* Ringkasan Status Validasi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase">Total Baris Terbaca</p>
                    <h4 className="text-2xl font-bold text-slate-800">{previewData.totalBaris} Baris</h4>
                  </div>
                  <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 uppercase">Baris Valid (Siap Simpan)</p>
                    <h4 className="text-2xl font-bold text-emerald-700">{previewData.validCount} Baris</h4>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>

                <div className="p-4 bg-white rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-rose-600 uppercase">Baris Gagal (Ada Galat)</p>
                    <h4 className="text-2xl font-bold text-rose-700">{previewData.invalidCount} Baris</h4>
                  </div>
                  <XCircle className="w-8 h-8 text-rose-500" />
                </div>
              </div>

              {/* Laporan Baris Gagal (Jika Ada) */}
              {previewData.invalidRows.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Laporan Rinci Baris Gagal ({previewData.invalidCount} Baris)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                          <th className="py-2.5 px-4 text-center">Baris Ke</th>
                          <th className="py-2.5 px-4">Kode Barang</th>
                          <th className="py-2.5 px-4">Nama Barang</th>
                          <th className="py-2.5 px-4 text-rose-700">Alasan Kesalahan (Error)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.invalidRows.map((inv, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/40">
                            <td className="py-2.5 px-4 text-center font-bold text-slate-600">
                              #{inv.barisKe}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                              {inv.kode_barang}
                            </td>
                            <td className="py-2.5 px-4 text-slate-700">{inv.nama_barang}</td>
                            <td className="py-2.5 px-4 font-medium text-rose-600">
                              {inv.alasanError}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tabel Pratinjau Baris Valid */}
              {previewData.validRows.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Pratinjau Data Valid ({previewData.validCount} Baris Siap Simpan)</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewData(null)}
                        className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleSimpanImport}
                        disabled={loadingSave}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingSave ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan ke Database</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-50 shadow-sm">
                        <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold">
                          <th className="py-2.5 px-3 text-center">Baris</th>
                          <th className="py-2.5 px-3">Kode</th>
                          <th className="py-2.5 px-3">Nama Barang</th>
                          <th className="py-2.5 px-3 text-center">Satuan</th>
                          <th className="py-2.5 px-3 text-right">Stok</th>
                          <th className="py-2.5 px-3 text-right">Harga Beli</th>
                          <th className="py-2.5 px-3 text-right">HPP</th>
                          <th className="py-2.5 px-3 text-right">Harga Bebas</th>
                          <th className="py-2.5 px-3 text-right">Harga Resep</th>
                          <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Harga Grosir</th>
                          <th className="py-2.5 px-3 text-center">Status Kode</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.validRows.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 text-center text-slate-400">#{r.barisKe}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-700">{r.kode_barang}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{r.nama_barang}</td>
                            <td className="py-2 px-3 text-center text-slate-600">{r.satuan}</td>
                            <td className="py-2 px-3 text-right font-semibold text-slate-700">{r.stok}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-600">{formatRupiah(r.harga_beli)}</td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-slate-800">{formatRupiah(r.harga_pokok)}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">{formatRupiah(r.harga_bebas)}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-700">{formatRupiah(r.harga_resep)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatRupiah(r.harga_grosir)}</td>
                            <td className="py-2 px-3 text-center">
                              {r.sudahAda ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  {updateJikaAda ? "Akan Diperbarui" : "Akan Dilewati"}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Barang Baru
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Konten Tab 2: EXPORT */}
      {tabAktif === "export" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Ekspor Katalog Barang */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Ekspor Katalog Master Barang</h3>
                <p className="text-xs text-slate-500">Unduh seluruh data barang ke file spreadsheet Excel (.xlsx)</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filter Status Barang
                </label>
                <select
                  value={exportBarangStatus}
                  onChange={(e) => setExportBarangStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="semua">Semua Status (Aktif & Nonaktif)</option>
                  <option value="aktif">Hanya Barang Aktif</option>
                  <option value="nonaktif">Hanya Barang Nonaktif</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleExportBarang}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Katalog Barang (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Ekspor Riwayat Transaksi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Ekspor Riwayat Transaksi</h3>
                <p className="text-xs text-slate-500">Unduh rincian penjualan & stok dengan filter tanggal</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={exportStartDate}
                    onChange={(e) => setExportStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={exportEndDate}
                    onChange={(e) => setExportEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tipe Transaksi
                </label>
                <select
                  value={exportTransaksiTipe}
                  onChange={(e) => setExportTransaksiTipe(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Semua Tipe (MASUK & KELUAR)</option>
                  <option value="MASUK">Hanya Transaksi MASUK (Restock)</option>
                  <option value="KELUAR">Hanya Transaksi KELUAR (Penjualan Kasir)</option>
                </select>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleExportTransaksi}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Riwayat Transaksi (.xlsx)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
