import { describe, it, expect } from "vitest";

describe("Pengujian Logika Metrik Dashboard & Grafik (Milestone f)", () => {
  it("Menghitung estimasi laba kotor: subtotal - (HPP * qty)", () => {
    const items = [
      { qty: 2, harga_satuan: 63500, subtotal: 127000, harga_pokok: 50616 },
      { qty: 1, harga_satuan: 5300, subtotal: 5300, harga_pokok: 3500 },
    ];

    let totalProfit = 0;
    for (const item of items) {
      const profitItem = item.subtotal - item.harga_pokok * item.qty;
      totalProfit += profitItem;
    }

    // Item 1: 127000 - (50616 * 2) = 127000 - 101232 = 25768
    // Item 2: 5300 - 3500 = 1800
    // Total Profit = 27568
    expect(totalProfit).toBe(27568);
  });

  it("Mengelompokkan dan mengurutkan Top Barang Terlaris berdasarkan kuantitas terbanyak", () => {
    const rawItems = [
      { kode_barang: "BRG-001", nama_barang: "Paracetamol", qty: 5, subtotal: 50000 },
      { kode_barang: "BRG-002", nama_barang: "Amoxicillin", qty: 12, subtotal: 120000 },
      { kode_barang: "BRG-001", nama_barang: "Paracetamol", qty: 10, subtotal: 100000 },
      { kode_barang: "BRG-003", nama_barang: "Vitamin C", qty: 8, subtotal: 40000 },
    ];

    const mapBarang: { [kode: string]: { nama_barang: string; total_qty: number; total_omzet: number } } = {};
    for (const item of rawItems) {
      if (!mapBarang[item.kode_barang]) {
        mapBarang[item.kode_barang] = {
          nama_barang: item.nama_barang,
          total_qty: 0,
          total_omzet: 0,
        };
      }
      mapBarang[item.kode_barang].total_qty += item.qty;
      mapBarang[item.kode_barang].total_omzet += item.subtotal;
    }

    const sorted = Object.values(mapBarang).sort((a, b) => b.total_qty - a.total_qty);

    expect(sorted[0].nama_barang).toBe("Paracetamol"); // 15 unit
    expect(sorted[0].total_qty).toBe(15);
    expect(sorted[1].nama_barang).toBe("Amoxicillin"); // 12 unit
    expect(sorted[1].total_qty).toBe(12);
    expect(sorted[2].nama_barang).toBe("Vitamin C"); // 8 unit
    expect(sorted[2].total_qty).toBe(8);
  });

  it("Mengagregasi penjualan per jenis harga (Bebas, Resep, Grosir)", () => {
    const sales = [
      { jenis: "BEBAS", subtotal: 100000 },
      { jenis: "RESEP", subtotal: 50000 },
      { jenis: "BEBAS", subtotal: 25000 },
      { jenis: "GROSIR", subtotal: 200000 },
    ];

    const jenisStats = { BEBAS: 0, RESEP: 0, GROSIR: 0 };
    for (const sale of sales) {
      if (sale.jenis in jenisStats) {
        (jenisStats as any)[sale.jenis] += sale.subtotal;
      }
    }

    expect(jenisStats.BEBAS).toBe(125000);
    expect(jenisStats.RESEP).toBe(50000);
    expect(jenisStats.GROSIR).toBe(200000);
  });

  it("Mendeteksi barang stok menipis (stok <= 10) dan membedakan stok habis (0)", () => {
    const inventory = [
      { nama: "Obat A", stok: 15 },
      { nama: "Obat B", stok: 10 },
      { nama: "Obat C", stok: 3 },
      { nama: "Obat D", stok: 0 },
    ];

    const lowStock = inventory.filter((i) => i.stok <= 10);
    expect(lowStock.length).toBe(3);

    const outOfStock = lowStock.filter((i) => i.stok === 0);
    expect(outOfStock.length).toBe(1);
    expect(outOfStock[0].nama).toBe("Obat D");
  });
});
