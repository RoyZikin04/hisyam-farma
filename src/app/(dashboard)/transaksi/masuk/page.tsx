"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowDownToLine,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RefreshCw,
  PackageCheck,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";
import { hitungHargaSetelahDiskon, hitungHargaPokok } from "@/services/pricing";

interface BarangItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
  harga_beli: number;
  diskon_persen: number;
  ppn_persen: number;
  harga_pokok: number;
}

interface ItemMasukRow {
  penjualan_id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok_lama: number;
  qty: number;
  harga_beli: number;
  diskon_persen: number;
  ppn_persen: number;
  harga_pokok_baru: number;
  subtotal: number;
}

export default function TransaksiMasukPage() {
  const [daftarBarang, setDaftarBarang] = useState<BarangItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarang, setSelectedBarang] = useState<BarangItem | null>(null);

  // Form input item yang sedang dipilih
  const [qtyInput, setQtyInput] = useState<number>(1);
  const [hargaBeliInput, setHargaBeliInput] = useState<number>(0);
  const [diskonInput, setDiskonInput] = useState<number>(0);
  const [ppnInput, setPpnInput] = useState<number>(11);
  const [keterangan, setKeterangan] = useState("");

  // Keranjang daftar barang masuk
  const [keranjangMasuk, setKeranjangMasuk] = useState<ItemMasukRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Ambil daftar barang aktif untuk pencarian
  useEffect(() => {
    fetch("/api/barang?limit=100&status=aktif")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setDaftarBarang(data.items);
      })
      .catch((err) => console.error("Gagal mengambil data barang:", err));
  }, []);

  // Saat barang dipilih, isi nilai default form
  const pilihBarang = (b: BarangItem) => {
    setSelectedBarang(b);
    setSearchQuery("");
    setQtyInput(1);
    setHargaBeliInput(b.harga_beli);
    setDiskonInput(b.diskon_persen);
    setPpnInput(b.ppn_persen);
  };

  // Kalkulasi HPP terbaru secara real-time via pricing service
  const setelahDiskon = hitungHargaSetelahDiskon(hargaBeliInput, diskonInput);
  const hppTerbaru = hitungHargaPokok(setelahDiskon, ppnInput);

  // Tambah item ke keranjang barang masuk
  const handleTambahKeKeranjang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarang) {
      setToast({ tipe: "error", pesan: "Pilih barang terlebih dahulu." });
      return;
    }
    if (qtyInput <= 0) {
      setToast({ tipe: "error", pesan: "Qty masuk minimal 1." });
      return;
    }

    const subtotal = Math.round(qtyInput * hargaBeliInput);

    // Cek apakah sudah ada di keranjang
    const existingIndex = keranjangMasuk.findIndex(
      (k) => k.penjualan_id === selectedBarang.id
    );

    if (existingIndex >= 0) {
      const updated = [...keranjangMasuk];
      updated[existingIndex].qty += qtyInput;
      updated[existingIndex].harga_beli = hargaBeliInput;
      updated[existingIndex].diskon_persen = diskonInput;
      updated[existingIndex].ppn_persen = ppnInput;
      updated[existingIndex].harga_pokok_baru = hppTerbaru;
      updated[existingIndex].subtotal = Math.round(
        updated[existingIndex].qty * hargaBeliInput
      );
      setKeranjangMasuk(updated);
    } else {
      setKeranjangMasuk([
        ...keranjangMasuk,
        {
          penjualan_id: selectedBarang.id,
          kode_barang: selectedBarang.kode_barang,
          nama_barang: selectedBarang.nama_barang,
          satuan: selectedBarang.satuan,
          stok_lama: selectedBarang.stok,
          qty: qtyInput,
          harga_beli: hargaBeliInput,
          diskon_persen: diskonInput,
          ppn_persen: ppnInput,
          harga_pokok_baru: hppTerbaru,
          subtotal,
        },
      ]);
    }

    setSelectedBarang(null);
    setQtyInput(1);
    setHargaBeliInput(0);
    setDiskonInput(0);
  };

  const handleHapusItem = (index: number) => {
    setKeranjangMasuk(keranjangMasuk.filter((_, i) => i !== index));
  };

  const grandTotalMasuk = keranjangMasuk.reduce((acc, curr) => acc + curr.subtotal, 0);

  // Simpan Transaksi Masuk ke Database
  const handleSimpanTransaksi = async () => {
    if (keranjangMasuk.length === 0) {
      setToast({ tipe: "error", pesan: "Keranjang barang masuk masih kosong." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const payload = {
        keterangan: keterangan || "Restock Pengadaan Barang",
        items: keranjangMasuk.map((k) => ({
          penjualan_id: k.penjualan_id,
          qty: k.qty,
          harga_beli: k.harga_beli,
          diskon_persen: k.diskon_persen,
          ppn_persen: k.ppn_persen,
        })),
      };

      const res = await fetch("/api/transaksi/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: data.error || "Gagal mencatat barang masuk." });
        setLoading(false);
        return;
      }

      setToast({ tipe: "sukses", pesan: data.message });
      setKeranjangMasuk([]);
      setKeterangan("");

      // Muat ulang daftar barang untuk memperbarui stok
      fetch("/api/barang?limit=100&status=aktif")
        .then((r) => r.json())
        .then((d) => {
          if (d.items) setDaftarBarang(d.items);
        });
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat memproses transaksi masuk." });
    } finally {
      setLoading(false);
    }
  };

  // Filter pencarian barang
  const filteredBarang = searchQuery.trim()
    ? daftarBarang.filter(
        (b) =>
          b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

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
          <ArrowDownToLine className="w-7 h-7 text-emerald-600" />
          <span>Transaksi Barang Masuk (Restock Inventori)</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Pencatatan pengadaan/restock obat & barang. Menambah stok dan memperbarui HPP secara otomatis tanpa mengubah harga jual.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Input & Kalkulator HPP Real-time */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            <span>Pilih & Input Barang Masuk</span>
          </h2>

          {/* Pencarian Autocomplete Barang */}
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cari Barang / Obat
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik kode atau nama barang..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            {/* Dropdown Hasil Pencarian */}
            {searchQuery.trim() && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                {filteredBarang.length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 text-center">
                    Barang tidak ditemukan.
                  </div>
                ) : (
                  filteredBarang.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => pilihBarang(b)}
                      className="w-full text-left p-2.5 hover:bg-emerald-50/80 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-700">{b.kode_barang}</span>
                        <span className="mx-2 text-slate-300">|</span>
                        <span className="font-medium text-slate-900">{b.nama_barang}</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                        Stok: {b.stok} {b.satuan}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Form Detail Item Terpilih */}
          {selectedBarang ? (
            <form onSubmit={handleTambahKeKeranjang} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                  <span className="font-mono">{selectedBarang.kode_barang}</span>
                  <span>Stok Saat Ini: {selectedBarang.stok} {selectedBarang.satuan}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-1">{selectedBarang.nama_barang}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Harga Beli Terakhir: {formatRupiah(selectedBarang.harga_beli)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Qty Masuk ({selectedBarang.satuan}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qtyInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setQtyInput(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Harga Beli Satuan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={hargaBeliInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setHargaBeliInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diskon (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={diskonInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setDiskonInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PPN (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={ppnInput}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setPpnInput(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Box Realtime Kalkulator HPP Terbaru */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Setelah Diskon:</span>
                  <span className="font-mono font-medium">{formatRupiah(setelahDiskon)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200/60 pt-1">
                  <span>HPP (Harga Pokok) Baru:</span>
                  <span className="font-mono text-sm">{formatRupiah(hppTerbaru)}</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-0.5">
                  * Harga jual lama tetap berlaku (tidak berubah otomatis).
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  Subtotal: <strong className="text-slate-800">{formatRupiah(qtyInput * hargaBeliInput)}</strong>
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Item</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
              Pilih barang dari kolom pencarian di atas untuk memasukkan kuantitas dan harga restock.
            </div>
          )}
        </div>

        {/* Kolom Kanan: Daftar Faktur / Keranjang Barang Masuk */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-emerald-600" />
                <span>Rincian Faktur Barang Masuk</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
                {keranjangMasuk.length} Barang Terpilih
              </span>
            </div>

            {/* Tabel Keranjang */}
            <div className="border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Barang</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    <th className="py-2.5 px-3 text-right">HPP Baru</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keranjangMasuk.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                        Belum ada barang di daftar faktur restock.
                      </td>
                    </tr>
                  ) : (
                    keranjangMasuk.map((k, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-800">{k.nama_barang}</p>
                          <p className="font-mono text-[10px] text-slate-400">
                            {k.kode_barang} (Stok: {k.stok_lama} + {k.qty} = {k.stok_lama + k.qty})
                          </p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-700">
                          {k.qty} {k.satuan}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatRupiah(k.harga_beli)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {formatRupiah(k.harga_pokok_baru)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRupiah(k.subtotal)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleHapusItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Input Keterangan Faktur */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Nomor Faktur Supplier (Opsional)
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Faktur No. 2026/PBF/0821 - PBF Kimia Farma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Footer Grand Total & Tombol Simpan */}
          <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Grand Total Restock:</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {formatRupiah(grandTotalMasuk)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSimpanTransaksi}
              disabled={keranjangMasuk.length === 0 || loading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Simpan Transaksi Barang Masuk & Mutasi Stok</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
