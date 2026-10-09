# Hisyam Farma - Sistem Penjualan & Stok Barang (POS & Inventori)

Aplikasi web modern berbasis **Next.js 15 (App Router)** untuk kasir penjualan (Point of Sale / POS) dan manajemen inventori stok barang/obat apotek dan toko ritel.

---

## 🚀 Fitur Utama

- **Autentikasi & Multi-Role (RBAC)**:
  - Role **ADMIN** (akses penuh dashboard, master barang, restock masuk, import/export, pengaturan toko, kelola pengguna).
  - Role **KASIR** (antarmuka terminal POS kasir cepat dan riwayat struk, terisolasi secara otomatis dari modul admin).
  - Keamanan sesi HTTP-Only cookie, password hash bcryptjs, rate limiter proteksi brute-force, dan server guard ganda.
- **Master Barang & Kalkulator Harga Terpusat**:
  - Tabel katalog lengkap 11 kolom dengan pencarian, filter, sorting, dan pagination.
  - Perhitungan HPP otomatis: `Harga Beli - Diskon + PPN`.
  - Margin harga jual multi-tier otomatis: **Harga Bebas**, **Harga Resep**, dan **Harga Grosir** dengan opsi pembulatan kelipatan (1, 50, 100, 500) dan override manual.
  - Soft-delete status aktif/nonaktif aman tanpa merusak riwayat transaksi.
- **Import & Export Spreadsheet Excel (ExcelJS)**:
  - Unduh template format resmi spreadsheet 11 kolom.
  - Validasi ketat format data per baris sebelum penyimpanan dengan laporan error baris gagal.
  - Opsi perbarui data jika kode barang sudah ada (`updateJikaAda`).
  - Ekspor katalog master barang dan laporan riwayat transaksi berfilter tanggal ke `.xlsx`.
- **Transaksi Masuk & Keluar (POS Kasir)**:
  - **Transaksi Masuk (Restock)**: Penambahan kuantitas stok dan pembaruan HPP otomatis dari harga beli terbaru tanpa mengubah harga jual master.
  - **Transaksi Keluar (Kasir POS)**: Antarmuka kasir cepat dengan tombol pintasan keyboard (**F2** Cari, **F9** Bayar, **Esc** Tutup, **Enter** Baru).
  - **Pengurangan Stok Atomik Bersyarat**: Mencegah stok minus dan race condition (`stok >= qty`) dalam transaksi database Prisma.
  - Modal pembayaran dengan tombol cepat pecahan uang rupiah (Uang Pas, 20rb, 50rb, 100rb, 200rb, 500rb), validasi kekurangan bayar, dan hitung kembalian instan.
- **Struk & Cetak Batch (Multi-Format)**:
  - Dukungan 3 ukuran kertas: **Thermal 58mm**, **Thermal 80mm**, dan **A4 Faktur Resmi**.
  - Cetak bersih terisolasi CSS `@media print` bebas margin browser dan elemen dashboard.
  - Fitur **Cetak Batch Massal** dengan pemisahan halaman otomatis (`struk-page-break`) tanpa batas jumlah transaksi.
  - Tombol dan shortcut pintasan **Cetak Struk (P)** langsung pada terminal kasir.
- **Dashboard & Analitik Grafik (Chart.js)**:
  - 5 Kartu KPI Statistik: Omzet Hari Ini, Omzet Bulan Ini, Estimasi Laba Kotor (Profit), Volume Transaksi, dan Peringatan Stok Menipis.
  - 4 Grafik Visualisasi Interaktif: Tren Penjualan vs Pengadaan, Doughnut Penjualan per Jenis Harga (Bebas/Resep/Grosir), Top 10 Obat Terlaris, dan Performa Kinerja Kasir.
  - Filter rentang waktu dinamis: 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, dan Tanggal Kustom.
  - Widget tabel peringatan obat dengan stok menipis (≤ 10) atau habis (0) dengan tautan aksi restock instan.
- **Pengaturan Toko & Preferensi POS**:
  - Konfigurasi profil apotek: Nama toko, alamat lengkap, nomor telepon/WhatsApp, dan catatan footer struk.
  - Pengaturan default persentase markup keuntungan (Harga Bebas, Resep, Grosir).
  - Pengaturan default pembulatan rupiah (1, 50, 100, 500) dan format ukuran kertas cetak struk.
- **Kelola Pengguna Sistem**:
  - Manajemen akun staf kasir dan administrator apotek.
  - Tambah pengguna baru dengan validasi username dan password terenkripsi bcryptjs.
  - Edit pengguna dan opsi reset password.
  - Toggle status aktif/nonaktif akun dengan proteksi anti-lockout administrator.

---

## 🛠️ Stack Teknologi

- **Framework**: Next.js 15 (App Router, React 19, Server Components & Route Handlers)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database & ORM**: SQLite (`prisma/dev.db`) & Prisma ORM
- **Spreadsheet**: ExcelJS
- **Visualisasi**: Chart.js & React-Chartjs-2
- **Testing**: Vitest (24 Unit Tests) & Puppeteer-Core (Browser Automation)

---

## 🔑 Akun Demo Bawaan

| Role | Username | Password |
|---|---|---|
| **Administrator** | `admin` | `admin123` |
| **Kasir** | `kasir` | `kasir123` |

---

## 📦 Cara Menjalankan Proyek Secara Lokal

1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/RoyZikin04/hisyam-farma.git
   cd hisyam-farma
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Inisialisasi Database & Seeder**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka browser di [http://localhost:3000](http://localhost:3000).

5. **Menjalankan Pengujian Unit (Vitest)**:
   ```bash
   npm test
   ```

---

## 📑 Dokumentasi Milestone
Setiap tahapan pengembangan didokumentasikan dalam berkas walkthrough:
- [`WALKTHROUGH_MILESTONE_A.md`](./WALKTHROUGH_MILESTONE_A.md): Setup Fondasi, Autentikasi, Database Prisma & SQLite
- [`WALKTHROUGH_MILESTONE_B.md`](./WALKTHROUGH_MILESTONE_B.md): Master Barang & Kalkulator Real-time
- [`WALKTHROUGH_MILESTONE_C.md`](./WALKTHROUGH_MILESTONE_C.md): Import & Export Spreadsheet Excel (ExcelJS)
- [`WALKTHROUGH_MILESTONE_D.md`](./WALKTHROUGH_MILESTONE_D.md): Transaksi Masuk & Keluar (POS Kasir Pintasan Keyboard)
- [`WALKTHROUGH_MILESTONE_E.md`](./WALKTHROUGH_MILESTONE_E.md): Struk Belanja & Cetak Batch (58mm, 80mm, A4)
- [`WALKTHROUGH_MILESTONE_F.md`](./WALKTHROUGH_MILESTONE_F.md): Dashboard Analitik & Visualisasi Grafik (Chart.js)
- [`WALKTHROUGH_MILESTONE_G.md`](./WALKTHROUGH_MILESTONE_G.md): Pengaturan Toko, Kelola Pengguna, Polish & Finalisasi
