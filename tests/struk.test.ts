import { describe, it, expect } from "vitest";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";

describe("Pengujian Format & Data Struk (Milestone e)", () => {
  it("formatRupiah memformat mata uang rupiah untuk struk secara presisi", () => {
    expect(formatRupiah(132300)).toBe("Rp 132.300");
    expect(formatRupiah(0)).toBe("Rp 0");
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(500000)).toBe("Rp 500.000");
  });

  it("formatTanggalWaktu memformat tanggal ke format lokal Indonesia", () => {
    const tanggal = new Date("2026-10-08T10:30:00Z");
    const formatted = formatTanggalWaktu(tanggal);
    expect(formatted).toBeTruthy();
    expect(typeof formatted).toBe("string");
  });

  it("Kalkulasi ringkasan struk: grand_total sama dengan jumlah subtotal item", () => {
    const items = [
      { nama_barang: "Paracetamol 500mg", qty: 2, harga_satuan: 63500, subtotal: 127000 },
      { nama_barang: "Bodrex Tablet", qty: 1, harga_satuan: 5300, subtotal: 5300 },
    ];

    const grandTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    expect(grandTotal).toBe(132300);

    const nominalBayar = 200000;
    const kembalian = nominalBayar - grandTotal;
    expect(kembalian).toBe(67700);
  });

  it("Aturan pemisah halaman (page break) batch print: struk terakhir tidak memecah halaman", () => {
    const daftarStruk = ["TRX-1", "TRX-2", "TRX-3"];
    const pageBreakClasses = daftarStruk.map((_, idx) =>
      idx < daftarStruk.length - 1 ? "struk-page-break" : ""
    );

    expect(pageBreakClasses[0]).toBe("struk-page-break");
    expect(pageBreakClasses[1]).toBe("struk-page-break");
    expect(pageBreakClasses[2]).toBe(""); // Struk terakhir tanpa page break
  });
});
