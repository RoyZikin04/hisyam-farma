import ExcelJS from "exceljs";
import { z } from "zod";
import { hitungSemuaHarga } from "@/services/pricing";

// Skema validasi baris impor Excel
export const barisImportSchema = z.object({
  kode_barang: z
    .string()
    .trim()
    .min(1, "Kode barang tidak boleh kosong")
    .toUpperCase(),
  nama_barang: z.string().trim().min(1, "Nama barang tidak boleh kosong"),
  satuan: z.string().trim().min(1, "Satuan tidak boleh kosong"),
  stok: z.number().int().min(0, "Stok tidak boleh bernilai minus"),
  harga_beli: z.number().int().min(0, "Harga beli tidak boleh bernilai minus"),
  diskon_persen: z.number().min(0).max(100, "Diskon harus antara 0% s/d 100%"),
  ppn_persen: z.number().min(0).max(100, "PPN harus antara 0% s/d 100%"),
  harga_pokok: z.number().int().min(0, "Harga pokok tidak boleh minus"),
  harga_bebas: z.number().int().min(0, "Harga bebas tidak boleh minus"),
  harga_resep: z.number().int().min(0, "Harga resep tidak boleh minus"),
  harga_grosir: z.number().int().min(0, "Harga grosir tidak boleh minus"),
});

export type BarisImportData = z.infer<typeof barisImportSchema>;

export interface HasilPreviewImport {
  totalBaris: number;
  validCount: number;
  invalidCount: number;
  validRows: (BarisImportData & { barisKe: number; sudahAda?: boolean })[];
  invalidRows: { barisKe: number; kode_barang: string; nama_barang: string; alasanError: string }[];
}

/**
 * 1. Membuat Template Excel (.xlsx) untuk Import Barang
 */
export async function buatTemplateExcel(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apotek Berkah POS";
  const worksheet = workbook.addWorksheet("Template Barang", {
    views: [{ showGridLines: true }],
  });

  // Definisi Kolom Template
  worksheet.columns = [
    { header: "Kode Barang*", key: "kode_barang", width: 18 },
    { header: "Nama Barang*", key: "nama_barang", width: 32 },
    { header: "Satuan*", key: "satuan", width: 14 },
    { header: "Stok*", key: "stok", width: 12 },
    { header: "Harga Beli*", key: "harga_beli", width: 16 },
    { header: "Diskon (%)", key: "diskon_persen", width: 14 },
    { header: "PPN (%)", key: "ppn_persen", width: 14 },
    { header: "Harga Pokok (HPP)", key: "harga_pokok", width: 18 },
    { header: "Harga Bebas", key: "harga_bebas", width: 16 },
    { header: "Harga Resep", key: "harga_resep", width: 16 },
    { header: "Harga Grosir", key: "harga_grosir", width: 16 },
  ];

  // Styling Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Emerald 600
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Contoh Baris Data Pengisian
  const contohBarang = [
    {
      kode_barang: "BRG-101",
      nama_barang: "Vitamin D3 1000IU",
      satuan: "Botol",
      stok: 60,
      harga_beli: 35000,
      diskon_persen: 0,
      ppn_persen: 11,
      harga_pokok: 38850,
      harga_bebas: 49000,
      harga_resep: 53000,
      harga_grosir: 45000,
    },
    {
      kode_barang: "BRG-102",
      nama_barang: "Madu Herbal Murni 250ml",
      satuan: "Botol",
      stok: 40,
      harga_beli: 42000,
      diskon_persen: 5,
      ppn_persen: 11,
      harga_pokok: 44289,
      harga_bebas: 56000,
      harga_resep: 60000,
      harga_grosir: 51000,
    },
  ];

  contohBarang.forEach((item) => {
    worksheet.addRow(item);
  });

  // Styling Data Rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.alignment = { vertical: "middle" };
      row.getCell("kode_barang").alignment = { horizontal: "center" };
      row.getCell("satuan").alignment = { horizontal: "center" };
      row.getCell("stok").alignment = { horizontal: "right" };
      row.getCell("harga_beli").numFmt = "#,##0";
      row.getCell("harga_pokok").numFmt = "#,##0";
      row.getCell("harga_bebas").numFmt = "#,##0";
      row.getCell("harga_resep").numFmt = "#,##0";
      row.getCell("harga_grosir").numFmt = "#,##0";
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 2. Parsing & Validasi Per Baris File Excel / CSV yang Diupload
 */
export async function parseExcelImport(
  buffer: Buffer,
  existingCodes: Set<string>,
  pengaturanToko?: {
    markupBebas: number;
    markupResep: number;
    markupGrosir: number;
    pembulatan: number;
  }
): Promise<HasilPreviewImport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("File Excel tidak memiliki lembar kerja (worksheet).");
  }

  const validRows: (BarisImportData & { barisKe: number; sudahAda?: boolean })[] = [];
  const invalidRows: { barisKe: number; kode_barang: string; nama_barang: string; alasanError: string }[] = [];

  const defaultMarkupBebas = pengaturanToko?.markupBebas ?? 25;
  const defaultMarkupResep = pengaturanToko?.markupResep ?? 35;
  const defaultMarkupGrosir = pengaturanToko?.markupGrosir ?? 15;
  const defaultPembulatan = pengaturanToko?.pembulatan ?? 100;

  worksheet.eachRow((row, rowNumber) => {
    // Lewati header row
    if (rowNumber === 1) return;

    // Ambil nilai per cell
    const kodeRaw = row.getCell(1).text?.trim() || "";
    const namaRaw = row.getCell(2).text?.trim() || "";
    const satuanRaw = row.getCell(3).text?.trim() || "Pcs";

    // Jika seluruh baris kosong, abaikan
    if (!kodeRaw && !namaRaw) return;

    const parseNumber = (val: any, defaultVal = 0): number => {
      if (val === null || val === undefined || val === "") return defaultVal;
      if (typeof val === "number") return val;
      const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
      return isNaN(num) ? defaultVal : num;
    };

    const stokRaw = Math.round(parseNumber(row.getCell(4).value, 0));
    const hargaBeliRaw = Math.round(parseNumber(row.getCell(5).value, 0));
    const diskonPersenRaw = parseNumber(row.getCell(6).value, 0);
    const ppnPersenRaw = parseNumber(row.getCell(7).value, 11);

    let hargaPokokRaw = Math.round(parseNumber(row.getCell(8).value, 0));
    let hargaBebasRaw = Math.round(parseNumber(row.getCell(9).value, 0));
    let hargaResepRaw = Math.round(parseNumber(row.getCell(10).value, 0));
    let hargaGrosirRaw = Math.round(parseNumber(row.getCell(11).value, 0));

    // Jika harga pokok atau harga jual kosong / 0, hitung otomatis lewat pricing service
    if (hargaPokokRaw <= 0 || hargaBebasRaw <= 0 || hargaGrosirRaw <= 0) {
      const hasil = hitungSemuaHarga({
        hargaBeli: hargaBeliRaw,
        diskonPersen: diskonPersenRaw,
        ppnPersen: ppnPersenRaw,
        markupBebasPersen: defaultMarkupBebas,
        markupResepPersen: defaultMarkupResep,
        markupGrosirPersen: defaultMarkupGrosir,
        pembulatan: defaultPembulatan,
      });

      if (hargaPokokRaw <= 0) hargaPokokRaw = hasil.hargaPokok;
      if (hargaBebasRaw <= 0) hargaBebasRaw = hasil.hargaBebas;
      if (hargaResepRaw <= 0) hargaResepRaw = hasil.hargaResep;
      if (hargaGrosirRaw <= 0) hargaGrosirRaw = hasil.hargaGrosir;
    }

    const rowObj = {
      kode_barang: kodeRaw,
      nama_barang: namaRaw,
      satuan: satuanRaw,
      stok: stokRaw,
      harga_beli: hargaBeliRaw,
      diskon_persen: diskonPersenRaw,
      ppn_persen: ppnPersenRaw,
      harga_pokok: hargaPokokRaw,
      harga_bebas: hargaBebasRaw,
      harga_resep: hargaResepRaw,
      harga_grosir: hargaGrosirRaw,
    };

    // Validasi Zod per baris
    const parsed = barisImportSchema.safeParse(rowObj);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      invalidRows.push({
        barisKe: rowNumber,
        kode_barang: kodeRaw || "-",
        nama_barang: namaRaw || "-",
        alasanError: errorMsg,
      });
    } else {
      const sudahAda = existingCodes.has(parsed.data.kode_barang);
      validRows.push({
        ...parsed.data,
        barisKe: rowNumber,
        sudahAda,
      });
    }
  });

  return {
    totalBaris: validRows.length + invalidRows.length,
    validCount: validRows.length,
    invalidCount: invalidRows.length,
    validRows,
    invalidRows,
  };
}

/**
 * 3. Ekspor Data Master Barang ke Excel (.xlsx)
 */
export async function exportBarangExcel(barangList: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apotek Berkah POS";
  const worksheet = workbook.addWorksheet("Katalog Barang", {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "Kode Barang", key: "kode_barang", width: 16 },
    { header: "Nama Barang", key: "nama_barang", width: 34 },
    { header: "Satuan", key: "satuan", width: 12 },
    { header: "Stok", key: "stok", width: 10 },
    { header: "Harga Beli (Rp)", key: "harga_beli", width: 16 },
    { header: "Diskon (%)", key: "diskon_persen", width: 12 },
    { header: "PPN (%)", key: "ppn_persen", width: 12 },
    { header: "HPP Pokok (Rp)", key: "harga_pokok", width: 16 },
    { header: "Harga Bebas (Rp)", key: "harga_bebas", width: 16 },
    { header: "Harga Resep (Rp)", key: "harga_resep", width: 16 },
    { header: "Harga Grosir (Rp)", key: "harga_grosir", width: 16 },
    { header: "Status", key: "status", width: 12 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF065F46" }, // Emerald 800
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  barangList.forEach((b) => {
    worksheet.addRow({
      kode_barang: b.kode_barang,
      nama_barang: b.nama_barang,
      satuan: b.satuan,
      stok: b.stok,
      harga_beli: b.harga_beli,
      diskon_persen: b.diskon_persen,
      ppn_persen: b.ppn_persen,
      harga_pokok: b.harga_pokok,
      harga_bebas: b.harga_bebas,
      harga_resep: b.harga_resep,
      harga_grosir: b.harga_grosir,
      status: b.aktif ? "Aktif" : "Nonaktif",
    });
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.alignment = { vertical: "middle" };
      row.getCell("kode_barang").alignment = { horizontal: "center" };
      row.getCell("satuan").alignment = { horizontal: "center" };
      row.getCell("status").alignment = { horizontal: "center" };
      row.getCell("stok").alignment = { horizontal: "right" };
      row.getCell("harga_beli").numFmt = "#,##0";
      row.getCell("harga_pokok").numFmt = "#,##0";
      row.getCell("harga_bebas").numFmt = "#,##0";
      row.getCell("harga_resep").numFmt = "#,##0";
      row.getCell("harga_grosir").numFmt = "#,##0";
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * 4. Ekspor Riwayat Transaksi ke Excel (.xlsx) dengan Filter Tanggal
 */
export async function exportTransaksiExcel(
  transaksiList: any[],
  filterInfo?: { startDate?: string; endDate?: string }
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Apotek Berkah POS";

  // ==========================================
  // SHEET 1: RINCIAN TRANSAKSI ITEM
  // ==========================================
  const worksheet = workbook.addWorksheet("Rincian Transaksi", {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "No. Transaksi", key: "no_transaksi", width: 22 },
    { header: "Tanggal", key: "tanggal", width: 18 },
    { header: "Tipe", key: "tipe", width: 14 },
    { header: "Pelanggan", key: "pelanggan", width: 20 },
    { header: "Kasir / Petugas", key: "user", width: 20 },
    { header: "Kode Barang", key: "kode_barang", width: 14 },
    { header: "Nama Barang", key: "nama_barang", width: 28 },
    { header: "Jenis Harga", key: "jenis_harga", width: 13 },
    { header: "Qty", key: "qty", width: 8 },
    { header: "Harga Satuan (Rp)", key: "harga_satuan", width: 16 },
    { header: "Subtotal (Rp)", key: "subtotal", width: 16 },
    { header: "HPP Satuan (Rp)", key: "hpp_satuan", width: 16 },
    { header: "Total HPP (Rp)", key: "total_hpp", width: 16 },
    { header: "Laba Kotor (Rp)", key: "laba_kotor", width: 16 },
    { header: "Margin (%)", key: "margin_persen", width: 12 },
    { header: "Grand Total Struk", key: "grand_total", width: 18 },
    { header: "Nominal Bayar", key: "nominal_bayar", width: 15 },
    { header: "Kembalian", key: "kembalian", width: 15 },
    { header: "Keterangan", key: "keterangan", width: 24 },
  ];

  // Header styling
  const headerRow = worksheet.getRow(1);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0F766E" }, // Teal 700
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Map untuk agregasi Sheet 2: Margin Per Tanggal
  const mapMarginHarian: {
    [tgl: string]: {
      tanggal: string;
      jumlahTrx: number;
      omzet: number;
      hpp: number;
      laba: number;
      qtyKeluar: number;
      restockRp: number;
      qtyMasuk: number;
    };
  } = {};

  // Isi data per item transaksi
  transaksiList.forEach((t) => {
    const tglObj = new Date(t.tanggal);
    const tglIso = tglObj.toISOString().split("T")[0];
    const tanggalFormatted = tglObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const namaPelanggan = t.nama_pelanggan || t.pelanggan?.nama || "Umum";

    // Inisialisasi agregasi per tanggal jika belum ada
    if (!mapMarginHarian[tglIso]) {
      mapMarginHarian[tglIso] = {
        tanggal: tglIso,
        jumlahTrx: 0,
        omzet: 0,
        hpp: 0,
        laba: 0,
        qtyKeluar: 0,
        restockRp: 0,
        qtyMasuk: 0,
      };
    }

    if (t.tipe === "KELUAR") {
      mapMarginHarian[tglIso].jumlahTrx += 1;
      mapMarginHarian[tglIso].omzet += t.grand_total;
    } else if (t.tipe === "MASUK") {
      mapMarginHarian[tglIso].restockRp += t.grand_total;
    }

    if (t.items && t.items.length > 0) {
      t.items.forEach((item: any) => {
        const isKeluar = t.tipe === "KELUAR";
        const hppSatuan = item.penjualan?.harga_pokok ?? (isKeluar ? 0 : item.harga_satuan);
        const totalHpp = isKeluar ? hppSatuan * item.qty : 0;
        const labaKotor = isKeluar ? item.subtotal - totalHpp : 0;
        const marginPersen = isKeluar && item.subtotal > 0 ? (labaKotor / item.subtotal) * 100 : 0;

        if (isKeluar) {
          mapMarginHarian[tglIso].hpp += totalHpp;
          mapMarginHarian[tglIso].laba += labaKotor;
          mapMarginHarian[tglIso].qtyKeluar += item.qty;
        } else {
          mapMarginHarian[tglIso].qtyMasuk += item.qty;
        }

        worksheet.addRow({
          no_transaksi: t.no_transaksi,
          tanggal: tanggalFormatted,
          tipe: t.tipe,
          pelanggan: namaPelanggan,
          user: t.user?.nama || "-",
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          jenis_harga: item.jenis_harga || "-",
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          subtotal: item.subtotal,
          hpp_satuan: isKeluar ? hppSatuan : "-",
          total_hpp: isKeluar ? totalHpp : "-",
          laba_kotor: isKeluar ? labaKotor : "-",
          margin_persen: isKeluar ? `${marginPersen.toFixed(1)}%` : "-",
          grand_total: t.grand_total,
          nominal_bayar: t.nominal_bayar ?? "-",
          kembalian: t.kembalian ?? "-",
          keterangan: t.keterangan || "-",
        });
      });
    } else {
      worksheet.addRow({
        no_transaksi: t.no_transaksi,
        tanggal: tanggalFormatted,
        tipe: t.tipe,
        pelanggan: namaPelanggan,
        user: t.user?.nama || "-",
        kode_barang: "-",
        nama_barang: "-",
        jenis_harga: "-",
        qty: 0,
        harga_satuan: 0,
        subtotal: 0,
        hpp_satuan: "-",
        total_hpp: "-",
        laba_kotor: "-",
        margin_persen: "-",
        grand_total: t.grand_total,
        nominal_bayar: t.nominal_bayar ?? "-",
        kembalian: t.kembalian ?? "-",
        keterangan: t.keterangan || "-",
      });
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.height = 20;
      row.alignment = { vertical: "middle" };
      row.getCell("no_transaksi").alignment = { horizontal: "center" };
      row.getCell("tanggal").alignment = { horizontal: "center" };
      row.getCell("tipe").alignment = { horizontal: "center" };
      row.getCell("kode_barang").alignment = { horizontal: "center" };
      row.getCell("jenis_harga").alignment = { horizontal: "center" };
      row.getCell("qty").alignment = { horizontal: "right" };
      row.getCell("harga_satuan").numFmt = "#,##0";
      row.getCell("subtotal").numFmt = "#,##0";
      row.getCell("grand_total").numFmt = "#,##0";
      if (typeof row.getCell("hpp_satuan").value === "number") {
        row.getCell("hpp_satuan").numFmt = "#,##0";
      }
      if (typeof row.getCell("total_hpp").value === "number") {
        row.getCell("total_hpp").numFmt = "#,##0";
      }
      if (typeof row.getCell("laba_kotor").value === "number") {
        row.getCell("laba_kotor").numFmt = "#,##0";
      }
      if (typeof row.getCell("nominal_bayar").value === "number") {
        row.getCell("nominal_bayar").numFmt = "#,##0";
      }
      if (typeof row.getCell("kembalian").value === "number") {
        row.getCell("kembalian").numFmt = "#,##0";
      }
    }
  });

  // ==========================================
  // SHEET 2: RINGKASAN MARGIN PER TANGGAL
  // ==========================================
  const sheetMargin = workbook.addWorksheet("Margin Per Tanggal", {
    views: [{ showGridLines: true }],
  });

  sheetMargin.columns = [
    { header: "Tanggal", key: "tanggal", width: 16 },
    { header: "Jumlah Transaksi", key: "jumlah_trx", width: 18 },
    { header: "Omzet Penjualan (Rp)", key: "omzet", width: 22 },
    { header: "Modal Pokok / HPP (Rp)", key: "hpp", width: 22 },
    { header: "Laba Kotor / Profit (Rp)", key: "laba", width: 24 },
    { header: "Margin (%)", key: "margin", width: 14 },
    { header: "Barang Keluar (Pcs)", key: "qty_keluar", width: 18 },
    { header: "Restock Masuk (Rp)", key: "restock_rp", width: 20 },
    { header: "Barang Masuk (Pcs)", key: "qty_masuk", width: 18 },
  ];

  const headerMarginRow = sheetMargin.getRow(1);
  headerMarginRow.height = 26;
  headerMarginRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF065F46" }, // Emerald 800
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const listHarian = Object.values(mapMarginHarian).sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal)
  );

  let totalAllOmzet = 0;
  let totalAllHpp = 0;
  let totalAllLaba = 0;
  let totalAllTrx = 0;
  let totalAllKeluar = 0;
  let totalAllRestock = 0;
  let totalAllMasuk = 0;

  listHarian.forEach((h) => {
    const marginPct = h.omzet > 0 ? (h.laba / h.omzet) * 100 : 0;
    totalAllOmzet += h.omzet;
    totalAllHpp += h.hpp;
    totalAllLaba += h.laba;
    totalAllTrx += h.jumlahTrx;
    totalAllKeluar += h.qtyKeluar;
    totalAllRestock += h.restockRp;
    totalAllMasuk += h.qtyMasuk;

    sheetMargin.addRow({
      tanggal: h.tanggal,
      jumlah_trx: h.jumlahTrx,
      omzet: h.omzet,
      hpp: h.hpp,
      laba: h.laba,
      margin: `${marginPct.toFixed(1)}%`,
      qty_keluar: h.qtyKeluar,
      restock_rp: h.restockRp,
      qty_masuk: h.qtyMasuk,
    });
  });

  // Footer baris TOTAL di Sheet Margin
  const totalMarginPct = totalAllOmzet > 0 ? (totalAllLaba / totalAllOmzet) * 100 : 0;
  const footerRow = sheetMargin.addRow({
    tanggal: "TOTAL KESELURUHAN",
    jumlah_trx: totalAllTrx,
    omzet: totalAllOmzet,
    hpp: totalAllHpp,
    laba: totalAllLaba,
    margin: `${totalMarginPct.toFixed(1)}%`,
    qty_keluar: totalAllKeluar,
    restock_rp: totalAllRestock,
    qty_masuk: totalAllMasuk,
  });

  footerRow.height = 24;
  footerRow.font = { bold: true };
  footerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" }, // Slate 100
    };
  });

  sheetMargin.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "middle" };
      row.getCell("tanggal").alignment = { horizontal: "center" };
      row.getCell("jumlah_trx").alignment = { horizontal: "center" };
      row.getCell("omzet").numFmt = "#,##0";
      row.getCell("hpp").numFmt = "#,##0";
      row.getCell("laba").numFmt = "#,##0";
      row.getCell("margin").alignment = { horizontal: "center" };
      row.getCell("qty_keluar").alignment = { horizontal: "right" };
      row.getCell("restock_rp").numFmt = "#,##0";
      row.getCell("qty_masuk").alignment = { horizontal: "right" };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

