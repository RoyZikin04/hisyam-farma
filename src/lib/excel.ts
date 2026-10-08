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
  const worksheet = workbook.addWorksheet("Laporan Transaksi", {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = [
    { header: "No. Transaksi", key: "no_transaksi", width: 20 },
    { header: "Tanggal", key: "tanggal", width: 18 },
    { header: "Tipe", key: "tipe", width: 12 },
    { header: "Kasir / Petugas", key: "user", width: 22 },
    { header: "Kode Barang", key: "kode_barang", width: 14 },
    { header: "Nama Barang", key: "nama_barang", width: 28 },
    { header: "Jenis Harga", key: "jenis_harga", width: 14 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Harga Satuan (Rp)", key: "harga_satuan", width: 16 },
    { header: "Subtotal (Rp)", key: "subtotal", width: 16 },
    { header: "Grand Total Struk", key: "grand_total", width: 18 },
    { header: "Nominal Bayar", key: "nominal_bayar", width: 16 },
    { header: "Kembalian", key: "kembalian", width: 16 },
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

  // Isi data per item transaksi
  transaksiList.forEach((t) => {
    const tanggalFormatted = new Date(t.tanggal).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (t.items && t.items.length > 0) {
      t.items.forEach((item: any) => {
        worksheet.addRow({
          no_transaksi: t.no_transaksi,
          tanggal: tanggalFormatted,
          tipe: t.tipe,
          user: t.user?.nama || "-",
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          jenis_harga: item.jenis_harga || "-",
          qty: item.qty,
          harga_satuan: item.harga_satuan,
          subtotal: item.subtotal,
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
        user: t.user?.nama || "-",
        kode_barang: "-",
        nama_barang: "-",
        jenis_harga: "-",
        qty: 0,
        harga_satuan: 0,
        subtotal: 0,
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
      if (typeof row.getCell("nominal_bayar").value === "number") {
        row.getCell("nominal_bayar").numFmt = "#,##0";
      }
      if (typeof row.getCell("kembalian").value === "number") {
        row.getCell("kembalian").numFmt = "#,##0";
      }
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
