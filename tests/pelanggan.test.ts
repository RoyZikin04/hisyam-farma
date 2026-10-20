import { describe, it, expect, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";

describe("Master Data Pelanggan (Pelanggan Service & Database)", () => {
  const testKode = "PLG-TEST-999";

  afterAll(async () => {
    await prisma.transaksi.deleteMany({
      where: { nama_pelanggan: "Budi Test Pelanggan" },
    });
    await prisma.pelanggan.deleteMany({
      where: { kode_pelanggan: testKode },
    });
    await prisma.$disconnect();
  });

  it("1. Harus berhasil membuat data pelanggan baru", async () => {
    // Bersihkan dulu jika ada sisa test sebelumnya
    await prisma.pelanggan.deleteMany({ where: { kode_pelanggan: testKode } });

    const pelanggan = await prisma.pelanggan.create({
      data: {
        kode_pelanggan: testKode,
        nama: "Budi Test Pelanggan",
        telepon: "081299998888",
        alamat: "Jl. Percobaan No. 99",
        catatan: "Pelanggan uji coba sistem",
        aktif: true,
      },
    });

    expect(pelanggan).toBeDefined();
    expect(pelanggan.kode_pelanggan).toBe(testKode);
    expect(pelanggan.nama).toBe("Budi Test Pelanggan");
    expect(pelanggan.aktif).toBe(true);
  });

  it("2. Harus berhasil mencari data pelanggan berdasarkan kode atau nama", async () => {
    const hasil = await prisma.pelanggan.findMany({
      where: {
        OR: [
          { kode_pelanggan: { contains: "TEST" } },
          { nama: { contains: "Budi Test" } },
        ],
      },
    });

    expect(hasil.length).toBeGreaterThanOrEqual(1);
    const found = hasil.find((p) => p.kode_pelanggan === testKode);
    expect(found).toBeDefined();
    expect(found?.nama).toBe("Budi Test Pelanggan");
  });

  it("3. Harus berhasil memperbarui status aktif/nonaktif pelanggan (soft delete)", async () => {
    const updated = await prisma.pelanggan.update({
      where: { kode_pelanggan: testKode },
      data: { aktif: false },
    });

    expect(updated.aktif).toBe(false);

    // Aktifkan kembali
    const reaktif = await prisma.pelanggan.update({
      where: { kode_pelanggan: testKode },
      data: { aktif: true },
    });
    expect(reaktif.aktif).toBe(true);
  });
});
