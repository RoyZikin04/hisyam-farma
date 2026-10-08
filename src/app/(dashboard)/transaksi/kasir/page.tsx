"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Receipt,
  X,
  Keyboard,
  Printer,
  Sparkles,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/format";
import { hitungSubtotalItem, hitungKembalian } from "@/services/pricing";
import ModalCetakStruk from "@/components/struk/ModalCetakStruk";
import { TransaksiData, PengaturanTokoData } from "@/components/struk/StrukView";

interface MasterBarang {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
  harga_bebas: number;
  harga_resep: number;
  harga_grosir: number;
}

interface CartItem {
  penjualan_id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok_tersedia: number;
  jenis_harga: "BEBAS" | "RESEP" | "GROSIR";
  qty: number;
  harga_satuan: number;
  subtotal: number;
}

interface TransaksiSelesaiData {
  id: string;
  no_transaksi: string;
  grand_total: number;
  nominal_bayar: number;
  kembalian: number;
  tanggal: string;
}

export default function KasirPOSPage() {
  const [daftarBarang, setDaftarBarang] = useState<MasterBarang[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modal Bayar (Checkout)
  const [modalBayarOpen, setModalBayarOpen] = useState(false);
  const [nominalBayar, setNominalBayar] = useState<number>(0);
  const [keterangan, setKeterangan] = useState("");
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Modal Selesai Transaksi & Cetak
  const [transaksiSelesai, setTransaksiSelesai] = useState<TransaksiData | null>(null);
  const [modalCetakOpen, setModalCetakOpen] = useState(false);
  const [pengaturan, setPengaturan] = useState<PengaturanTokoData | undefined>();

  // Toast
  const [toast, setToast] = useState<{ tipe: "sukses" | "error"; pesan: string } | null>(null);

  // Ref untuk autofocus keyboard
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bayarInputRef = useRef<HTMLInputElement>(null);

  // Muat daftar master barang aktif
  const loadBarang = useCallback(() => {
    fetch("/api/barang?limit=100&status=aktif")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) setDaftarBarang(data.items);
      })
      .catch((err) => console.error("Gagal memuat barang:", err));
  }, []);

  useEffect(() => {
    loadBarang();
    // Muat data pengaturan toko untuk struk
    fetch("/api/pengaturan")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPengaturan(data);
      })
      .catch((err) => console.error("Gagal memuat pengaturan toko:", err));

    // Autofocus ke input pencarian barang saat halaman pertama kali dimuat
    searchInputRef.current?.focus();
  }, [loadBarang]);

  // Handler Keyboard Shortcuts (F2: Cari, F9: Bayar, Escape: Tutup, P: Cetak, Enter: Baru)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (transaksiSelesai) {
        if (e.key === "Enter") {
          e.preventDefault();
          setTransaksiSelesai(null);
          searchInputRef.current?.focus();
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          setModalCetakOpen(true);
        }
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0 && !modalBayarOpen) {
          bukaModalBayar();
        }
      } else if (e.key === "Escape") {
        if (modalBayarOpen) {
          setModalBayarOpen(false);
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, modalBayarOpen, transaksiSelesai]);

  // Tambah barang ke keranjang belanja
  const tambahKeKeranjang = (barang: MasterBarang, jenisHarga: "BEBAS" | "RESEP" | "GROSIR" = "BEBAS") => {
    if (barang.stok <= 0) {
      setToast({ tipe: "error", pesan: `Stok "${barang.nama_barang}" kosong (0)!` });
      return;
    }

    const hargaSatuan =
      jenisHarga === "BEBAS"
        ? barang.harga_bebas
        : jenisHarga === "RESEP"
        ? barang.harga_resep
        : barang.harga_grosir;

    const existingIndex = cart.findIndex((c) => c.penjualan_id === barang.id && c.jenis_harga === jenisHarga);

    if (existingIndex >= 0) {
      const item = cart[existingIndex];
      if (item.qty + 1 > barang.stok) {
        setToast({
          tipe: "error",
          pesan: `Stok tidak mencukupi! Hanya tersedia ${barang.stok} ${barang.satuan}.`,
        });
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = hitungSubtotalItem(updated[existingIndex].qty, hargaSatuan);
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          penjualan_id: barang.id,
          kode_barang: barang.kode_barang,
          nama_barang: barang.nama_barang,
          satuan: barang.satuan,
          stok_tersedia: barang.stok,
          jenis_harga: jenisHarga,
          qty: 1,
          harga_satuan: hargaSatuan,
          subtotal: hargaSatuan,
        },
      ]);
    }

    setSearchQuery("");
    searchInputRef.current?.focus();
  };

  // Ubah jenis harga item keranjang
  const ubahJenisHarga = (index: number, jenis: "BEBAS" | "RESEP" | "GROSIR") => {
    const item = cart[index];
    const barang = daftarBarang.find((b) => b.id === item.penjualan_id);
    if (!barang) return;

    let hargaBaru = barang.harga_bebas;
    if (jenis === "RESEP") hargaBaru = barang.harga_resep;
    if (jenis === "GROSIR") hargaBaru = barang.harga_grosir;

    const updated = [...cart];
    updated[index].jenis_harga = jenis;
    updated[index].harga_satuan = hargaBaru;
    updated[index].subtotal = hitungSubtotalItem(updated[index].qty, hargaBaru);
    setCart(updated);
  };

  // Ubah Qty item keranjang
  const ubahQty = (index: number, delta: number) => {
    const item = cart[index];
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      hapusItem(index);
      return;
    }

    if (newQty > item.stok_tersedia) {
      setToast({
        tipe: "error",
        pesan: `Stok tidak mencukupi! Tersedia: ${item.stok_tersedia} ${item.satuan}.`,
      });
      return;
    }

    const updated = [...cart];
    updated[index].qty = newQty;
    updated[index].subtotal = hitungSubtotalItem(newQty, item.harga_satuan);
    setCart(updated);
  };

  const hapusItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const grandTotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalItemQty = cart.reduce((acc, curr) => acc + curr.qty, 0);

  // Buka Modal Pembayaran
  const bukaModalBayar = () => {
    if (cart.length === 0) return;
    setNominalBayar(grandTotal); // default uang pas
    setModalBayarOpen(true);
    setTimeout(() => {
      bayarInputRef.current?.focus();
      bayarInputRef.current?.select();
    }, 150);
  };

  const kembalian = hitungKembalian(nominalBayar, grandTotal);
  const nominalKurang = Math.max(0, grandTotal - nominalBayar);

  // Eksekusi Checkout Kasir ke Backend
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nominalBayar < grandTotal) {
      setToast({ tipe: "error", pesan: "Nominal pembayaran masih kurang!" });
      return;
    }

    setLoadingCheckout(true);
    setToast(null);

    try {
      const payload = {
        nominal_bayar: nominalBayar,
        keterangan: keterangan || undefined,
        items: cart.map((c) => ({
          penjualan_id: c.penjualan_id,
          jenis_harga: c.jenis_harga,
          qty: c.qty,
        })),
      };

      const res = await fetch("/api/transaksi/keluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setToast({ tipe: "error", pesan: json.error || "Gagal memproses transaksi kasir." });
        setLoadingCheckout(false);
        return;
      }

      // Berhasil
      setModalBayarOpen(false);
      setCart([]);
      setKeterangan("");
      loadBarang(); // Muat ulang stok

      setTransaksiSelesai(json.data);
    } catch {
      setToast({ tipe: "error", pesan: "Gangguan jaringan saat memproses transaksi." });
    } finally {
      setLoadingCheckout(false);
    }
  };

  // Filter pencarian barang real-time
  const filteredBarang = searchQuery.trim()
    ? daftarBarang.filter(
        (b) =>
          b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.kode_barang.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-4">
      {/* Toast Notifikasi */}
      {toast && (
        <Toast
          tipe={toast.tipe}
          pesan={toast.pesan}
          onTutup={() => setToast(null)}
        />
      )}

      {/* Header Kasir & Bar Shortcut Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Terminal Kasir (POS)</h1>
            <p className="text-xs text-slate-500">Pelayanan transaksi penjualan obat & barang cepat</p>
          </div>
        </div>

        {/* Petunjuk Shortcut Keyboard */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Keyboard className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Pintasan:</span>
          <span className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">F2</span>
          <span>Cari</span>
          <span className="text-slate-300">•</span>
          <span className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">F9</span>
          <span>Bayar</span>
          <span className="text-slate-300">•</span>
          <span className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono font-bold text-slate-800">Esc</span>
          <span>Tutup</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri: Baris Pencarian Barang & Keranjang Belanja */}
        <div className="lg:col-span-8 space-y-4">
          {/* Kolom Pencarian Cepat Barang */}
          <div className="relative bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && filteredBarang.length > 0) {
                    tambahKeKeranjang(filteredBarang[0]);
                  }
                }}
                placeholder="Ketik nama atau kode barang... (Tekan F2 untuk fokus)"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
              />
            </div>

            {/* Dropdown Hasil Autocomplete Pencarian */}
            {searchQuery.trim() && (
              <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                {filteredBarang.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Barang tidak ditemukan dalam katalog aktif.
                  </div>
                ) : (
                  filteredBarang.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {b.kode_barang}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{b.nama_barang}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                          <span className="font-semibold text-emerald-700">
                            Stok: {b.stok} {b.satuan}
                          </span>
                          <span>•</span>
                          <span>Bebas: <strong>{formatRupiah(b.harga_bebas)}</strong></span>
                          <span>•</span>
                          <span>Resep: <strong>{formatRupiah(b.harga_resep)}</strong></span>
                          <span>•</span>
                          <span>Grosir: <strong>{formatRupiah(b.harga_grosir)}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => tambahKeKeranjang(b, "BEBAS")}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          + Bebas
                        </button>
                        <button
                          type="button"
                          onClick={() => tambahKeKeranjang(b, "RESEP")}
                          className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          + Resep
                        </button>
                        <button
                          type="button"
                          onClick={() => tambahKeKeranjang(b, "GROSIR")}
                          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                        >
                          + Grosir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Tabel Keranjang Belanja */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <span>Keranjang Belanja ({cart.length} Jenis Barang)</span>
              </h2>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Kosongkan Keranjang
                </button>
              )}
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/60 border-b border-slate-200 text-slate-500 uppercase font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-3 text-center">Jenis Harga</th>
                    <th className="py-3 px-3 text-right">Harga Satuan</th>
                    <th className="py-3 px-3 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-2 text-center">Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShoppingCart className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-slate-600 text-sm">Keranjang masih kosong</p>
                          <p className="text-xs text-slate-400">Ketik nama obat di kolom pencarian atau tekan F2.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    cart.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        {/* Nama Barang & Kode */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 text-sm">{item.nama_barang}</p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {item.kode_barang} • Stok: {item.stok_tersedia} {item.satuan}
                          </p>
                        </td>

                        {/* Dropdown Jenis Harga */}
                        <td className="py-3 px-3 text-center">
                          <select
                            value={item.jenis_harga}
                            onChange={(e) => ubahJenisHarga(idx, e.target.value as any)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold border cursor-pointer outline-none ${
                              item.jenis_harga === "BEBAS"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : item.jenis_harga === "RESEP"
                                ? "bg-teal-50 text-teal-800 border-teal-200"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            }`}
                          >
                            <option value="BEBAS">Harga Bebas</option>
                            <option value="RESEP">Harga Resep</option>
                            <option value="GROSIR">Harga Grosir</option>
                          </select>
                        </td>

                        {/* Harga Satuan */}
                        <td className="py-3 px-3 text-right font-mono text-slate-700 font-semibold">
                          {formatRupiah(item.harga_satuan)}
                        </td>

                        {/* Qty Counter Buttons */}
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
                            <button
                              type="button"
                              onClick={() => ubahQty(idx, -1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-3 py-1 font-bold text-slate-900 text-xs min-w-8 text-center">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => ubahQty(idx, 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Subtotal */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {formatRupiah(item.subtotal)}
                        </td>

                        {/* Hapus */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => hapusItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Ringkasan Pembayaran & Tombol Bayar Besar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>Ringkasan Pembayaran</span>
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Total Item Belanja:</span>
                <span className="font-semibold text-slate-800">{totalItemQty} Barang</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Variasi Obat:</span>
                <span className="font-semibold text-slate-800">{cart.length} Baris</span>
              </div>
            </div>

            {/* Display Grand Total Besar */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-1">
              <p className="text-xs font-semibold uppercase text-emerald-800 tracking-wider">
                Total Tagihan Belanja
              </p>
              <h3 className="text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
                {formatRupiah(grandTotal)}
              </h3>
            </div>

            {/* Tombol Besar Bayar (F9) */}
            <button
              type="button"
              onClick={bukaModalBayar}
              disabled={cart.length === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-6 h-6" />
              <span>PROSES BAYAR (F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Pembayaran (Checkout Dialog) */}
      {modalBayarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Header Modal */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-200" />
                <h3 className="text-lg font-bold">Pembayaran Kasir</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalBayarOpen(false)}
                className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-5">
              {/* Grand Total Display */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total yang Harus Dibayar
                </span>
                <p className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">
                  {formatRupiah(grandTotal)}
                </p>
              </div>

              {/* Tombol Cepat Nominal Uang */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilihan Cepat Uang Diterima:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNominalBayar(grandTotal)}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200"
                  >
                    Uang Pas
                  </button>
                  {[20000, 50000, 100000, 200000, 500000].map((nominal) => (
                    <button
                      key={nominal}
                      type="button"
                      onClick={() => setNominalBayar(nominal)}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {formatRupiah(nominal)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Nominal Bayar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Uang Diterima (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={bayarInputRef}
                  type="number"
                  min="0"
                  required
                  value={nominalBayar || ""}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setNominalBayar(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              {/* Status Kembalian / Kekurangan */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
                  nominalKurang > 0
                    ? "bg-rose-50 border-rose-200 text-rose-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <span className="font-semibold">
                  {nominalKurang > 0 ? "Kekurangan Pembayaran:" : "Kembalian Uang:"}
                </span>
                <span className="text-xl font-bold font-mono">
                  {nominalKurang > 0 ? formatRupiah(nominalKurang) : formatRupiah(kembalian)}
                </span>
              </div>

              {/* Keterangan Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Pembeli langganan / Catatan dokter"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tombol Submit Pembayaran */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalBayarOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Batal (Esc)
                </button>
                <button
                  type="submit"
                  disabled={nominalKurang > 0 || loadingCheckout}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingCheckout ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Selesaikan Transaksi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Berhasil Transaksi & Cetak Struk */}
      {transaksiSelesai && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden text-center p-6 space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Transaksi Berhasil!</h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                No. Transaksi: {transaksiSelesai.no_transaksi}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Belanja:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {formatRupiah(transaksiSelesai.grand_total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Uang Diterima:</span>
                <span className="font-mono text-slate-800">
                  {formatRupiah(transaksiSelesai.nominal_bayar)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-emerald-700">
                <span>Kembalian:</span>
                <span className="font-mono">{formatRupiah(transaksiSelesai.kembalian)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalCetakOpen(true)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Cetak Struk (P)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTransaksiSelesai(null);
                  searchInputRef.current?.focus();
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
              >
                Transaksi Baru (Enter)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cetak Struk Kasir */}
      {transaksiSelesai && (
        <ModalCetakStruk
          transaksiList={[transaksiSelesai]}
          pengaturan={pengaturan}
          isOpen={modalCetakOpen}
          onClose={() => setModalCetakOpen(false)}
        />
      )}
    </div>
  );
}
