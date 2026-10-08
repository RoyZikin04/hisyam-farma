import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { prosesTransaksiMasuk, prosesTransaksiKeluar } from "../src/services/stok";

describe("Layanan Mutasi Stok (src/services/stok.ts)", () => {
  let testUserId: string;
  let testBarangId: string;

  beforeEach(async () => {
    // Cari admin user untuk test
    let user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          nama: "Admin Test",
          username: "admintest",
          password: "password123",
          role: "ADMIN",
          aktif: true,
        },
      });
    }
    testUserId = user.id;

    // Bersihkan dan buat barang tes khusus
    await prisma.transaksiItem.deleteMany({
      where: { kode_barang: "BRG-TEST-STOK" },
    });
    await prisma.penjualan.deleteMany({
      where: { kode_barang: "BRG-TEST-STOK" },
    });

    const barang = await prisma.penjualan.create({
      data: {
        kode_barang: "BRG-TEST-STOK",
        nama_barang: "Obat Uji Stok Mutasi",
        satuan: "Strip",
        stok: 10,
        harga_beli: 10000,
        diskon_persen: 0,
        ppn_persen: 11,
        harga_pokok: 11100,
        harga_bebas: 14000,
        harga_resep: 15000,
        harga_grosir: 13000,
        aktif: true,
      },
    });
    testBarangId = barang.id;
  });

  afterAll(async () => {
    await prisma.transaksiItem.deleteMany({
      where: { kode_barang: "BRG-TEST-STOK" },
    });
    await prisma.penjualan.deleteMany({
      where: { kode_barang: "BRG-TEST-STOK" },
    });
    await prisma.$disconnect();
  });

  it("1. Transaksi MASUK harus menambah stok, update harga beli & HPP, tanpa ubah harga jual", async () => {
    const res = await prosesTransaksiMasuk({
      userId: testUserId,
      keterangan: "Restock Uji",
      items: [
        {
          penjualan_id: testBarangId,
          qty: 15,
          harga_beli: 12000, // harga beli baru naik
          diskon_persen: 5,
          ppn_persen: 11,
        },
      ],
    });

    expect(res.tipe).toBe("MASUK");
    expect(res.nominal_bayar).toBeNull();
    expect(res.kembalian).toBeNull();
    expect(res.items[0].jenis_harga).toBeNull();
    expect(res.items[0].harga_satuan).toBe(12000);

    // Cek data barang di database
    const updatedBarang = await prisma.penjualan.findUnique({
      where: { id: testBarangId },
    });

    // Stok awal 10 + 15 = 25
    expect(updatedBarang?.stok).toBe(25);
    // Harga beli terupdate
    expect(updatedBarang?.harga_beli).toBe(12000);
    // HPP terupdate: 12.000 - 5% = 11.400 + 11% = 12.654
    expect(updatedBarang?.harga_pokok).toBe(12654);
    // Harga jual TIDAK berubah otomatis sesuai revisi 4
    expect(updatedBarang?.harga_bebas).toBe(14000);
    expect(updatedBarang?.harga_resep).toBe(15000);
    expect(updatedBarang?.harga_grosir).toBe(13000);
  });

  it("2. Transaksi KELUAR harus mengurangi stok secara atomic dan menghitung total serta kembalian", async () => {
    // Pembelian 4 strip harga bebas (14.000) = 56.000
    const res = await prosesTransaksiKeluar({
      userId: testUserId,
      nominal_bayar: 100000,
      keterangan: "Pembeli Umum",
      items: [
        {
          penjualan_id: testBarangId,
          jenis_harga: "BEBAS",
          qty: 4,
        },
      ],
    });

    expect(res.tipe).toBe("KELUAR");
    expect(res.grand_total).toBe(56000);
    expect(res.nominal_bayar).toBe(100000);
    expect(res.kembalian).toBe(44000);
    expect(res.items[0].qty).toBe(4);
    expect(res.items[0].harga_satuan).toBe(14000);

    // Cek sisa stok di DB (10 - 4 = 6)
    const updatedBarang = await prisma.penjualan.findUnique({
      where: { id: testBarangId },
    });
    expect(updatedBarang?.stok).toBe(6);
  });

  it("3. Transaksi KELUAR harus menolak checkout jika stok tidak mencukupi (pencegahan stok minus)", async () => {
    // Stok saat ini 10, coba beli 15
    await expect(
      prosesTransaksiKeluar({
        userId: testUserId,
        nominal_bayar: 300000,
        items: [
          {
            penjualan_id: testBarangId,
            jenis_harga: "BEBAS",
            qty: 15,
          },
        ],
      })
    ).rejects.toThrow(/tidak mencukupi/i);

    // Pastikan stok tidak berubah (tetap 10)
    const barang = await prisma.penjualan.findUnique({
      where: { id: testBarangId },
    });
    expect(barang?.stok).toBe(10);
  });

  it("4. Transaksi KELUAR harus menolak pembayaran jika nominal bayar kurang dari grand total", async () => {
    // 2 strip @ 14.000 = 28.000, bayar 20.000
    await expect(
      prosesTransaksiKeluar({
        userId: testUserId,
        nominal_bayar: 20000,
        items: [
          {
            penjualan_id: testBarangId,
            jenis_harga: "BEBAS",
            qty: 2,
          },
        ],
      })
    ).rejects.toThrow(/kurang dari total/i);
  });
});
