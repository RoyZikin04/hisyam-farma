import { prisma } from "../src/lib/prisma";
import ExcelJS from "exceljs";
import {
  buatTemplateExcel,
  parseExcelImport,
  exportBarangExcel,
  exportTransaksiExcel,
} from "../src/lib/excel";

async function runMilestoneCTest() {
  console.log("=== PENGUJIAN OTOMATIS MILESTONE (C) - EXCEL MANAGEMENT ===");

  // 1. Uji Pembuatan Template Excel
  console.log("1. Menguji pembuatan template Excel...");
  const templateBuffer = await buatTemplateExcel();
  if (!templateBuffer || templateBuffer.length === 0) {
    throw new Error("Gagal membuat template Excel.");
  }

  const wbTemplate = new ExcelJS.Workbook();
  await wbTemplate.xlsx.load(templateBuffer as any);
  const sheetTemplate = wbTemplate.worksheets[0];
  if (!sheetTemplate || sheetTemplate.columnCount < 11) {
    throw new Error("Template Excel tidak memiliki 11 kolom yang sesuai.");
  }
  console.log(`✓ Template Excel berhasil dibuat: ${sheetTemplate.columnCount} kolom, ${sheetTemplate.rowCount} baris (termasuk contoh).`);

  // 2. Buat File Excel Uji Coba dengan Baris Valid & Baris Error
  console.log("2. Menyiapkan data uji coba impor (baris valid + baris error sengaja)...");
  const wbUji = new ExcelJS.Workbook();
  const wsUji = wbUji.addWorksheet("Import Data");
  wsUji.columns = [
    { header: "Kode Barang*", key: "kode_barang" },
    { header: "Nama Barang*", key: "nama_barang" },
    { header: "Satuan*", key: "satuan" },
    { header: "Stok*", key: "stok" },
    { header: "Harga Beli*", key: "harga_beli" },
    { header: "Diskon (%)", key: "diskon_persen" },
    { header: "PPN (%)", key: "ppn_persen" },
    { header: "Harga Pokok (HPP)", key: "harga_pokok" },
    { header: "Harga Bebas", key: "harga_bebas" },
    { header: "Harga Resep", key: "harga_resep" },
    { header: "Harga Grosir", key: "harga_grosir" },
  ];

  // Baris Valid 1 (Barang Baru)
  wsUji.addRow({
    kode_barang: "BRG-201",
    nama_barang: "Minyak Telon Plus 100ml",
    satuan: "Botol",
    stok: 45,
    harga_beli: 25000,
    diskon_persen: 0,
    ppn_persen: 11,
    harga_pokok: 27750,
    harga_bebas: 35000,
    harga_resep: 38000,
    harga_grosir: 32000,
  });

  // Baris Valid 2 (Update Barang BRG-001)
  wsUji.addRow({
    kode_barang: "BRG-001",
    nama_barang: "Paracetamol 500mg Forte",
    satuan: "Strip",
    stok: 130,
    harga_beli: 48000,
    diskon_persen: 5,
    ppn_persen: 11,
    harga_pokok: 50616,
    harga_bebas: 63500,
    harga_resep: 68500,
    harga_grosir: 58500,
  });

  // Baris Gagal 1: Nama barang kosong
  wsUji.addRow({
    kode_barang: "BRG-ERR-1",
    nama_barang: "",
    satuan: "Strip",
    stok: 10,
    harga_beli: 5000,
    diskon_persen: 0,
    ppn_persen: 11,
  });

  // Baris Gagal 2: Harga beli minus (-10000)
  wsUji.addRow({
    kode_barang: "BRG-ERR-2",
    nama_barang: "Obat Rusak",
    satuan: "Botol",
    stok: 5,
    harga_beli: -10000,
    diskon_persen: 0,
    ppn_persen: 11,
  });

  const bufferUji = Buffer.from(await wbUji.xlsx.writeBuffer());

  // 3. Uji Parsing & Validasi Per Baris
  console.log("3. Menguji parsing dan validasi per baris...");
  const existingItems = await prisma.penjualan.findMany({ select: { kode_barang: true } });
  const existingCodes = new Set(existingItems.map(e => e.kode_barang.toUpperCase()));

  const hasilPreview = await parseExcelImport(bufferUji, existingCodes, {
    markupBebas: 25,
    markupResep: 35,
    markupGrosir: 15,
    pembulatan: 100,
  });

  console.log(`✓ Hasil Pratinjau: Total ${hasilPreview.totalBaris} baris.`);
  console.log(`  - Baris Valid: ${hasilPreview.validCount} baris.`);
  console.log(`  - Baris Gagal: ${hasilPreview.invalidCount} baris.`);

  if (hasilPreview.validCount !== 2) throw new Error(`Harusnya 2 baris valid, didapat: ${hasilPreview.validCount}`);
  if (hasilPreview.invalidCount !== 2) throw new Error(`Harusnya 2 baris gagal, didapat: ${hasilPreview.invalidCount}`);

  console.log("✓ Laporan Baris Gagal yang terdeteksi:");
  hasilPreview.invalidRows.forEach(r => {
    console.log(`  - Baris #${r.barisKe} [${r.kode_barang}]: ${r.alasanError}`);
  });

  // 4. Uji Simpan ke Database dengan Opsi Update Jika Ada
  console.log("4. Menguji penyimpanan ke database (dengan update jika kode ada)...");
  for (const item of hasilPreview.validRows) {
    const { barisKe, sudahAda, ...cleanData } = item as any;
    await prisma.penjualan.upsert({
      where: { kode_barang: item.kode_barang },
      update: {
        ...cleanData,
        aktif: true,
      },
      create: {
        ...cleanData,
        aktif: true,
      },
    });
  }

  // Verifikasi BRG-201 tersimpan
  const cek201 = await prisma.penjualan.findUnique({ where: { kode_barang: "BRG-201" } });
  if (!cek201) throw new Error("BRG-201 gagal tersimpan ke database.");
  console.log(`✓ Barang baru BRG-201 (${cek201.nama_barang}) berhasil disimpan.`);

  // Verifikasi BRG-001 terupdate
  const cek001 = await prisma.penjualan.findUnique({ where: { kode_barang: "BRG-001" } });
  if (!cek001 || cek001.stok !== 130) throw new Error("BRG-001 gagal diperbarui.");
  console.log(`✓ Barang BRG-001 (${cek001.nama_barang}) berhasil diperbarui, stok sekarang = ${cek001.stok}.`);

  // 5. Uji Ekspor Data Barang ke Excel (.xlsx)
  console.log("5. Menguji ekspor data master barang ke Excel...");
  const semuaBarang = await prisma.penjualan.findMany();
  const exportBarangBuffer = await exportBarangExcel(semuaBarang);
  if (!exportBarangBuffer || exportBarangBuffer.length === 0) {
    throw new Error("Gagal membuat ekspor barang.");
  }
  const wbExpBarang = new ExcelJS.Workbook();
  await wbExpBarang.xlsx.load(exportBarangBuffer as any);
  const sheetExpBarang = wbExpBarang.worksheets[0];
  console.log(`✓ File ekspor barang berhasil: ${sheetExpBarang.rowCount - 1} data barang tereskpor ke .xlsx.`);

  // 6. Uji Ekspor Transaksi ke Excel (.xlsx)
  console.log("6. Menguji ekspor data transaksi ke Excel...");
  const transaksiList = await prisma.transaksi.findMany({
    include: { user: true, items: true },
  });
  const exportTransaksiBuffer = await exportTransaksiExcel(transaksiList);
  if (!exportTransaksiBuffer || exportTransaksiBuffer.length === 0) {
    throw new Error("Gagal membuat ekspor transaksi.");
  }
  const wbExpTrx = new ExcelJS.Workbook();
  await wbExpTrx.xlsx.load(exportTransaksiBuffer as any);
  const sheetExpTrx = wbExpTrx.worksheets[0];
  console.log(`✓ File ekspor transaksi berhasil: ${sheetExpTrx.name} dengan ${sheetExpTrx.columnCount} kolom.`);

  // Bersihkan data uji
  await prisma.penjualan.deleteMany({ where: { kode_barang: "BRG-201" } });
  console.log("✓ Data pengujian BRG-201 berhasil dibersihkan.");

  console.log("=== SEMUA PENGUJIAN MILESTONE (C) BERHASIL 100% ===");
}

runMilestoneCTest()
  .catch((e) => {
    console.error("Terjadi error saat pengujian:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
