/**
 * Layanan Logika Harga Terpusat (Pricing Service)
 * Seluruh perhitungan harga wajib dipanggil dari file ini.
 * Semua nilai rupiah menggunakan tipe data integer (Int).
 */

export interface HitungHargaParams {
  hargaBeli: number;
  diskonPersen: number;
  ppnPersen: number;
  markupBebasPersen: number;
  markupResepPersen: number;
  markupGrosirPersen: number;
  pembulatan?: number; // 1 | 50 | 100 | 500
}

export interface HasilKalkulasiHarga {
  hargaSetelahDiskon: number; // Int rupiah
  hargaPokok: number;         // Int rupiah (HPP)
  hargaBebas: number;         // Int rupiah
  hargaResep: number;         // Int rupiah
  hargaGrosir: number;        // Int rupiah
}

/**
 * Membulatkan nilai nominal rupiah ke atas sesuai langkah (step).
 * Contoh step: 1, 50, 100, 500.
 */
export function bulatkanHarga(nilai: number, step: number = 100): number {
  if (step <= 1) {
    return Math.round(nilai);
  }
  return Math.ceil(nilai / step) * step;
}

/**
 * Menghitung harga setelah potongan diskon.
 * Rumus: harga_beli - (harga_beli * diskon%)
 */
export function hitungHargaSetelahDiskon(hargaBeli: number, diskonPersen: number): number {
  const diskon = (hargaBeli * diskonPersen) / 100;
  return Math.max(0, Math.round(hargaBeli - diskon));
}

/**
 * Menghitung Harga Pokok Penjualan (HPP).
 * Rumus: harga_setelah_diskon + (harga_setelah_diskon * ppn%)
 */
export function hitungHargaPokok(hargaSetelahDiskon: number, ppnPersen: number): number {
  const ppn = (hargaSetelahDiskon * ppnPersen) / 100;
  return Math.max(0, Math.round(hargaSetelahDiskon + ppn));
}

/**
 * Menghitung harga jual berdasarkan HPP, persentase markup, dan opsi pembulatan.
 * Rumus: harga_pokok * (1 + markup%) lalu dibulatkan ke atas.
 */
export function hitungHargaJual(
  hargaPokok: number,
  markupPersen: number,
  stepPembulatan: number = 100
): number {
  const hargaKotor = hargaPokok * (1 + markupPersen / 100);
  return bulatkanHarga(hargaKotor, stepPembulatan);
}

/**
 * Menghitung seluruh rangkaian harga (setelah diskon, HPP, bebas, resep, grosir)
 * secara real-time dari parameter input barang.
 */
export function hitungSemuaHarga(params: HitungHargaParams): HasilKalkulasiHarga {
  const step = params.pembulatan ?? 100;
  const hargaSetelahDiskon = hitungHargaSetelahDiskon(params.hargaBeli, params.diskonPersen);
  const hargaPokok = hitungHargaPokok(hargaSetelahDiskon, params.ppnPersen);
  const hargaBebas = hitungHargaJual(hargaPokok, params.markupBebasPersen, step);
  const hargaResep = hitungHargaJual(hargaPokok, params.markupResepPersen, step);
  const hargaGrosir = hitungHargaJual(hargaPokok, params.markupGrosirPersen, step);

  return {
    hargaSetelahDiskon,
    hargaPokok,
    hargaBebas,
    hargaResep,
    hargaGrosir,
  };
}

/**
 * Menghitung subtotal item transaksi kasir.
 */
export function hitungSubtotalItem(qty: number, hargaSatuan: number): number {
  return Math.max(0, Math.round(qty * hargaSatuan));
}

/**
 * Menghitung kembalian pembayaran.
 */
export function hitungKembalian(nominalBayar: number, grandTotal: number): number {
  return Math.max(0, nominalBayar - grandTotal);
}
