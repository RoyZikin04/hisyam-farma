# Walkthrough Hasil Pengerjaan: Milestone (c) Import & Export Excel (ExcelJS)

Milestone (c) telah selesai dikerjakan secara menyeluruh sesuai dengan spesifikasi teknis dan revisi perpindahan ke pustaka **`ExcelJS`**.

---

## 1. Ringkasan Pekerjaan Selesai

- **Layanan Spreadsheet Excel Terpadu (`src/lib/excel.ts`)**:
  - Menggunakan library **`exceljs`** untuk pembuatan workbook dan pemrosesan stream/buffer.
  - **Unduh Template Resmi (`buatTemplateExcel()`)**: Menyediakan format spreadsheet dengan 11 kolom, styling header emerald modern, dan baris contoh data pengisian.
  - **Validasi Zod Per Baris (`parseExcelImport()`)**: Memvalidasi setiap baris input (kode barang, nama barang, satuan, stok, harga beli, diskon, PPN, HPP, harga bebas, resep, dan grosir).
  - **Kalkulasi Otomatis Fallback**: Jika harga pokok atau harga jual dikosongkan pada Excel, sistem otomatis menghitungnya secara real-time via `src/services/pricing.ts` dan setting default toko.
  - **Pemisahan Baris Valid & Baris Gagal**: Mengelompokkan baris valid dan baris tidak valid beserta alasan error secara spesifik.
  - **Opsi "Update Jika Kode Ada" (`updateJikaAda`)**: Memungkinkan pembaruan data master secara massal tanpa duplikasi kode barang.
  - **Ekspor Katalog Master Barang (`exportBarangExcel()`)**: Mengekspor seluruh data barang ke format `.xlsx` dengan format angka rapi dan status aktif/nonaktif.
  - **Ekspor Riwayat Transaksi (`exportTransaksiExcel()`)**: Mengekspor laporan penjualan & mutasi stok dengan filter rentang tanggal dan tipe transaksi (MASUK / KELUAR).

- **Endpoint API Server-Side**:
  - `GET /api/barang/template` (Unduh template .xlsx)
  - `POST /api/barang/import/preview` (Validasi baris & pratinjau sebelum simpan)
  - `POST /api/barang/import/save` (Simpan baris valid ke DB via Prisma transaction)
  - `GET /api/barang/export` (Ekspor barang ke .xlsx)
  - `GET /api/transaksi/export` (Ekspor transaksi ke .xlsx dengan filter tanggal)
  - Seluruh endpoint dilindungi oleh role guard server-side (`requireAdmin()`).

- **Antarmuka Pengguna (`/import-export`)**:
  - Tab 1: **Impor Data Barang**:
    - Tombol unduh template resmi
    - Pemilih berkas spreadsheet (.xlsx/.csv)
    - Checkbox opsi pembaruan data jika kode barang sudah ada
    - Ringkasan kartu (Total Baris, Baris Valid, Baris Gagal)
    - **Laporan Rinci Baris Gagal** dengan tabel penjelas error per baris
    - **Pratinjau Data Valid** dengan badge status kode ("Barang Baru" / "Akan Diperbarui")
    - Tombol simpan data ke database
  - Tab 2: **Ekspor Data (.xlsx)**:
    - Card ekspor katalog barang dengan filter status
    - Card ekspor riwayat transaksi dengan filter tanggal mulai, tanggal selesai, dan tipe transaksi

---

## 2. Bukti Pengujian Otomatis Browser

Pengujian otomatis dilakukan pada server lokal di `http://localhost:3002`.

### A. Tampilan Halaman Manajemen Data Excel
Menampilkan formulir unduh template, upload berkas, dan opsi pembaruan data.

### B. Pratinjau (Preview) Data & Laporan Rinci Baris Gagal
File uji coba dengan 4 baris data diproses secara transparan:
- **Total Baris**: 4 Baris
- **Baris Valid**: 2 Baris (Siap Simpan)
- **Baris Gagal**: 2 Baris (Ada Galat)
- **Laporan Rinci Baris Gagal**:
  - Baris `#4` [BRG-GAGAL-1]: *Nama barang tidak boleh kosong*
  - Baris `#5` [BRG-GAGAL-2]: *Stok tidak boleh bernilai minus*

### C. Konfirmasi Hasil Penyimpanan ke Database
Baris data valid berhasil disimpan ke database dengan ringkasan notifikasi:
`Impor selesai: 1 barang baru disimpan, 1 barang diperbarui, 0 barang dilewati.`

### D. Tab Ekspor Data (.xlsx)
Menyediakan filter status barang dan filter rentang tanggal transaksi untuk pengunduhan file spreadsheet.

---

## 3. Status Verifikasi Pengujian

- **Unit & Integration Test (`tests/test_milestone_c.ts`)**:
  - Pembuatan template Excel: Berhasil
  - Parsing & validasi per baris Zod: Berhasil
  - Simpan & update data: Berhasil
  - Ekspor katalog barang .xlsx: Berhasil
  - Ekspor riwayat transaksi .xlsx: Berhasil
- **Vitest Unit Test (`tests/pricing.test.ts`)**: 6 dari 6 pengujian lolos 100%.

---

Milestone (c) telah selesai secara sempurna. Siap melanjutkan ke **Milestone (d): Transaksi Masuk & Keluar (POS Kasir Cepat + Atomic Concurrency)**.
