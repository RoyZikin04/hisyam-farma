import { prisma } from "../src/lib/prisma";
import { hitungSemuaHarga } from "../src/services/pricing";

async function runTest() {
  console.log("=== PENGUJIAN OTOMATIS MILESTONE (B) ===");

  // 1. Verifikasi Data Master Barang di Database
  const totalAwal = await prisma.penjualan.count({ where: { aktif: true } });
  console.log(`✓ Total barang aktif awal: ${totalAwal} barang`);

  // 2. Verifikasi Kalkulator Harga Real-Time (src/services/pricing.ts)
  const kalkulasi = hitungSemuaHarga({
    hargaBeli: 20000,
    diskonPersen: 10,
    ppnPersen: 11,
    markupBebasPersen: 25,
    markupResepPersen: 35,
    markupGrosirPersen: 15,
    pembulatan: 100,
  });

  console.log("✓ Hasil Kalkulator Real-Time:");
  console.log(`  - Harga Beli: Rp 20.000, Diskon: 10%, PPN: 11%`);
  console.log(`  - Setelah Diskon: Rp ${kalkulasi.hargaSetelahDiskon}`);
  console.log(`  - HPP (Harga Pokok): Rp ${kalkulasi.hargaPokok}`);
  console.log(`  - Harga Bebas (+25%): Rp ${kalkulasi.hargaBebas}`);
  console.log(`  - Harga Resep (+35%): Rp ${kalkulasi.hargaResep}`);
  console.log(`  - Harga Grosir (+15%): Rp ${kalkulasi.hargaGrosir}`);

  if (kalkulasi.hargaSetelahDiskon !== 18000) throw new Error("Gagal kalkulasi diskon");
  if (kalkulasi.hargaPokok !== 19980) throw new Error("Gagal kalkulasi HPP");
  if (kalkulasi.hargaBebas !== 25000) throw new Error("Gagal kalkulasi harga bebas");
  if (kalkulasi.hargaResep !== 27000) throw new Error("Gagal kalkulasi harga resep");
  if (kalkulasi.hargaGrosir !== 23000) throw new Error("Gagal kalkulasi harga grosir");

  // 3. Uji Tambah Barang Baru
  const kodeBaru = "BRG-099";
  // Hapus dulu jika sudah ada dari percobaan sebelumnya
  await prisma.penjualan.deleteMany({ where: { kode_barang: kodeBaru } });

  const barangBaru = await prisma.penjualan.create({
    data: {
      kode_barang: kodeBaru,
      nama_barang: "Vitamin B Kompleks Plus",
      satuan: "Botol",
      stok: 50,
      harga_beli: 20000,
      diskon_persen: 10,
      ppn_persen: 11,
      harga_pokok: kalkulasi.hargaPokok,
      harga_bebas: 26000, // Diuji override manual oleh admin
      harga_resep: kalkulasi.hargaResep,
      harga_grosir: kalkulasi.hargaGrosir,
      aktif: true,
    },
  });
  console.log(`✓ Berhasil tambah barang baru: ${barangBaru.nama_barang} (${barangBaru.kode_barang})`);

  // 4. Uji Ubah (Edit) Data Barang
  const barangUpdate = await prisma.penjualan.update({
    where: { id: barangBaru.id },
    data: {
      stok: 75,
      nama_barang: "Vitamin B Kompleks Plus Forte",
    },
  });
  console.log(`✓ Berhasil edit barang: Stok diubah menjadi ${barangUpdate.stok}, Nama: ${barangUpdate.nama_barang}`);

  // 5. Uji Soft Delete (Nonaktifkan)
  const barangSoftDelete = await prisma.penjualan.update({
    where: { id: barangBaru.id },
    data: { aktif: false },
  });
  console.log(`✓ Berhasil soft delete: Status aktif = ${barangSoftDelete.aktif}`);

  const cekCountAktif = await prisma.penjualan.count({ where: { aktif: true } });
  if (cekCountAktif !== totalAwal) {
    throw new Error(`Count aktif harusnya sama dengan awal (${totalAwal}), didapat: ${cekCountAktif}`);
  }

  // 6. Uji Restore (Aktifkan Kembali)
  const barangRestore = await prisma.penjualan.update({
    where: { id: barangBaru.id },
    data: { aktif: true },
  });
  console.log(`✓ Berhasil restore: Status aktif kembali = ${barangRestore.aktif}`);

  // Bersihkan barang pengujian
  await prisma.penjualan.delete({ where: { id: barangBaru.id } });
  console.log("✓ Data pengujian berhasil dibersihkan.");
  console.log("=== SELURUH PENGUJIAN MILESTONE (B) SUKSES 100% ===");
}

runTest()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
