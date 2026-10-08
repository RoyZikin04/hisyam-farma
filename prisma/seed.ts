import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding database...");

  // 1. Bersihkan data lama jika ada
  await prisma.transaksiItem.deleteMany();
  await prisma.transaksi.deleteMany();
  await prisma.penjualan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.pengaturan.deleteMany();

  // 2. Buat Pengaturan Default
  await prisma.pengaturan.create({
    data: {
      id: "default",
      nama_toko: "Apotek & Toko Sehat Berkah",
      alamat: "Jl. Kesehatan Raya No. 45, Jakarta",
      telepon: "0812-3456-7890",
      footer_struk: "Terima kasih atas kepercayaan Anda. Semoga lekas sembuh!",
      default_markup_bebas: 25.0,
      default_markup_resep: 35.0,
      default_markup_grosir: 15.0,
      pembulatan: 100,
      ukuran_kertas: "80mm",
    },
  });
  console.log("Data Pengaturan berhasil dibuat.");

  // 3. Buat Akun Admin & Kasir
  const passwordAdmin = await bcrypt.hash("admin123", 10);
  const passwordKasir = await bcrypt.hash("kasir123", 10);

  await prisma.user.create({
    data: {
      nama: "Administrator Apotek",
      username: "admin",
      password: passwordAdmin,
      role: "ADMIN",
      aktif: true,
    },
  });

  await prisma.user.create({
    data: {
      nama: "Kasir Utama",
      username: "kasir",
      password: passwordKasir,
      role: "KASIR",
      aktif: true,
    },
  });
  console.log("Akun Admin (admin/admin123) dan Kasir (kasir/kasir123) berhasil dibuat.");

  // 4. Data 20 Barang Contoh (Apotek / Toko Kecil)
  // Perhitungan otomatis sesuai rumus di pricing.ts
  const daftarBarang = [
    { kode: "BRG-001", nama: "Paracetamol 500mg", satuan: "Strip", stok: 120, beli: 4500, diskon: 0, ppn: 11 },
    { kode: "BRG-002", nama: "Amoxicillin 500mg", satuan: "Strip", stok: 85, beli: 8000, diskon: 5, ppn: 11 },
    { kode: "BRG-003", nama: "Antasida Doen Suspensi", satuan: "Botol", stok: 45, beli: 7500, diskon: 0, ppn: 11 },
    { kode: "BRG-004", nama: "OBH Tropica Plus 100ml", satuan: "Botol", stok: 35, beli: 18000, diskon: 2, ppn: 11 },
    { kode: "BRG-005", nama: "Betadine Antiseptik 30ml", satuan: "Botol", stok: 50, beli: 25000, diskon: 0, ppn: 11 },
    { kode: "BRG-006", nama: "Bodrex Ekstra Tablet", satuan: "Strip", stok: 150, beli: 3500, diskon: 0, ppn: 11 },
    { kode: "BRG-007", nama: "Promag Tablet", satuan: "Strip", stok: 140, beli: 8500, diskon: 3, ppn: 11 },
    { kode: "BRG-008", nama: "Sanmol Drop 15ml", satuan: "Botol", stok: 30, beli: 22000, diskon: 0, ppn: 11 },
    { kode: "BRG-009", nama: "Panadol Biru 500mg", satuan: "Strip", stok: 110, beli: 11000, diskon: 0, ppn: 11 },
    { kode: "BRG-010", nama: "Minyak Kayu Putih 60ml", satuan: "Botol", stok: 60, beli: 24000, diskon: 5, ppn: 11 },
    { kode: "BRG-011", nama: "Hansaplast Plester Kain", satuan: "Box", stok: 40, beli: 28000, diskon: 0, ppn: 11 },
    { kode: "BRG-012", nama: "Tolak Angin Cair 15ml", satuan: "Box", stok: 80, beli: 42000, diskon: 4, ppn: 11 },
    { kode: "BRG-013", nama: "Cataflam 50mg Tablet", satuan: "Strip", stok: 65, beli: 68000, diskon: 0, ppn: 11 },
    { kode: "BRG-014", nama: "Neurobion Forte", satuan: "Strip", stok: 75, beli: 38000, diskon: 2, ppn: 11 },
    { kode: "BRG-015", nama: "Enervon-C Multivitamin", satuan: "Strip", stok: 90, beli: 6000, diskon: 0, ppn: 11 },
    { kode: "BRG-016", nama: "Insto Regular Tetes Mata", satuan: "Botol", stok: 55, beli: 14500, diskon: 0, ppn: 11 },
    { kode: "BRG-017", nama: "Voltaren Emulgel 10g", satuan: "Tube", stok: 25, beli: 48000, diskon: 0, ppn: 11 },
    { kode: "BRG-018", nama: "Decolgen Strip", satuan: "Strip", stok: 95, beli: 3200, diskon: 0, ppn: 11 },
    { kode: "BRG-019", nama: "Konidin Tablet", satuan: "Strip", stok: 105, beli: 3000, diskon: 0, ppn: 11 },
    { kode: "BRG-020", nama: "Vitamin C IPI 50mg", satuan: "Botol", stok: 130, beli: 6500, diskon: 0, ppn: 11 },
  ];

  for (const b of daftarBarang) {
    const setelahDiskon = Math.round(b.beli * (1 - b.diskon / 100));
    const hpp = Math.round(setelahDiskon * (1 + b.ppn / 100));
    const hargaBebas = Math.ceil((hpp * 1.25) / 100) * 100;   // markup 25%
    const hargaResep = Math.ceil((hpp * 1.35) / 100) * 100;   // markup 35%
    const hargaGrosir = Math.ceil((hpp * 1.15) / 100) * 100;  // markup 15%

    await prisma.penjualan.create({
      data: {
        kode_barang: b.kode,
        nama_barang: b.nama,
        satuan: b.satuan,
        stok: b.stok,
        harga_beli: b.beli,
        diskon_persen: b.diskon,
        ppn_persen: b.ppn,
        harga_pokok: hpp,
        harga_bebas: hargaBebas,
        harga_resep: hargaResep,
        harga_grosir: hargaGrosir,
        aktif: true,
      },
    });
  }

  console.log(`20 barang master berhasil dimasukkan ke tabel 'penjualan'.`);
  console.log("Seeding selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
