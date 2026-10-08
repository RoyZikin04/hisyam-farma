import ExcelJS from "exceljs";
import path from "path";

async function createSampleExcel() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Data Barang");

  ws.columns = [
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

  // Baris 1: Valid Barang Baru
  ws.addRow({
    kode_barang: "BRG-301",
    nama_barang: "Madu Propolis Alami",
    satuan: "Botol",
    stok: 35,
    harga_beli: 45000,
    diskon_persen: 0,
    ppn_persen: 11,
    harga_pokok: 49950,
    harga_bebas: 62500,
    harga_resep: 67500,
    harga_grosir: 57500,
  });

  // Baris 2: Valid Update Barang BRG-002 (Amoxicillin)
  ws.addRow({
    kode_barang: "BRG-002",
    nama_barang: "Amoxicillin 500mg (Stok Baru)",
    satuan: "Strip",
    stok: 120,
    harga_beli: 8500,
    diskon_persen: 5,
    ppn_persen: 11,
    harga_pokok: 8963,
    harga_bebas: 11300,
    harga_resep: 12200,
    harga_grosir: 10400,
  });

  // Baris 3: Gagal - Nama Barang Kosong
  ws.addRow({
    kode_barang: "BRG-GAGAL-1",
    nama_barang: "",
    satuan: "Strip",
    stok: 20,
    harga_beli: 5000,
    diskon_persen: 0,
    ppn_persen: 11,
  });

  // Baris 4: Gagal - Stok Minus (-15)
  ws.addRow({
    kode_barang: "BRG-GAGAL-2",
    nama_barang: "Obat Kadaluarsa Tes",
    satuan: "Box",
    stok: -15,
    harga_beli: 10000,
    diskon_persen: 0,
    ppn_persen: 11,
  });

  const outPath = path.join(__dirname, "sample_test_import.xlsx");
  await wb.xlsx.writeFile(outPath);
  console.log("✓ Sample Excel berhasil dibuat di:", outPath);
}

createSampleExcel().catch(console.error);
