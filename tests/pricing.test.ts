import { describe, it, expect } from "vitest";
import {
  bulatkanHarga,
  hitungHargaSetelahDiskon,
  hitungHargaPokok,
  hitungHargaJual,
  hitungSemuaHarga,
  hitungSubtotalItem,
  hitungKembalian,
} from "../src/services/pricing";

describe("Layanan Logika Harga (src/services/pricing.ts)", () => {
  it("harus membulatkan harga integer sesuai step yang ditentukan", () => {
    expect(bulatkanHarga(10250, 100)).toBe(10300);
    expect(bulatkanHarga(10200, 100)).toBe(10200);
    expect(bulatkanHarga(10210, 50)).toBe(10250);
    expect(bulatkanHarga(10010, 500)).toBe(10500);
    expect(bulatkanHarga(10001, 1)).toBe(10001);
  });

  it("harus menghitung harga setelah diskon dalam integer rupiah", () => {
    // Beli 10.000, diskon 10% -> 9.000
    expect(hitungHargaSetelahDiskon(10000, 10)).toBe(9000);
    // Beli 10.000, diskon 0% -> 10.000
    expect(hitungHargaSetelahDiskon(10000, 0)).toBe(10000);
    // Beli 12.345, diskon 15% -> 12345 - 1851.75 = 10493.25 -> 10493
    expect(hitungHargaSetelahDiskon(12345, 15)).toBe(10493);
  });

  it("harus menghitung harga pokok (HPP = setelah diskon + PPN)", () => {
    // Setelah diskon 9.000, PPN 11% -> 9000 + 990 = 9990
    expect(hitungHargaPokok(9000, 11)).toBe(9990);
    // Tanpa PPN (0%) -> 9000
    expect(hitungHargaPokok(9000, 0)).toBe(9000);
  });

  it("harus menghitung harga jual dengan markup dan pembulatan", () => {
    const hpp = 10000;
    // Markup 25%, step 100 -> 10000 * 1.25 = 12500 -> 12500
    expect(hitungHargaJual(hpp, 25, 100)).toBe(12500);
    // Markup 33%, step 100 -> 10000 * 1.33 = 13300 -> 13300
    expect(hitungHargaJual(hpp, 33, 100)).toBe(13300);
    // Markup 33.3%, step 100 -> 10000 * 1.333 = 13330 -> 13400
    expect(hitungHargaJual(hpp, 33.3, 100)).toBe(13400);
  });

  it("harus menghitung seluruh komponen harga secara serentak", () => {
    const hasil = hitungSemuaHarga({
      hargaBeli: 10000,
      diskonPersen: 5,
      ppnPersen: 11,
      markupBebasPersen: 25,
      markupResepPersen: 35,
      markupGrosirPersen: 15,
      pembulatan: 100,
    });

    // Beli 10.000, diskon 5% -> 9.500
    expect(hasil.hargaSetelahDiskon).toBe(9500);
    // 9.500 + (9.500 * 11%) = 9.500 + 1.045 = 10.545
    expect(hasil.hargaPokok).toBe(10545);
    // Bebas: 10.545 * 1.25 = 13.181,25 -> dibulatkan step 100 = 13.200
    expect(hasil.hargaBebas).toBe(13200);
    // Resep: 10.545 * 1.35 = 14.235,75 -> dibulatkan step 100 = 14.300
    expect(hasil.hargaResep).toBe(14300);
    // Grosir: 10.545 * 1.15 = 12.126,75 -> dibulatkan step 100 = 12.200
    expect(hasil.hargaGrosir).toBe(12200);
  });

  it("harus menghitung subtotal dan kembalian transaksi kasir secara presisi", () => {
    expect(hitungSubtotalItem(3, 15000)).toBe(45000);
    expect(hitungKembalian(50000, 45000)).toBe(5000);
    expect(hitungKembalian(40000, 45000)).toBe(0);
  });
});
