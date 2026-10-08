# Walkthrough Hasil Pengerjaan: Milestone (b) CRUD Barang + Kalkulator Harga

Milestone (b) telah selesai dikerjakan secara menyeluruh sesuai dengan seluruh aturan proyek dan revisi yang disepakati.

---

## 1. Ringkasan Pekerjaan Selesai

- **Halaman Master Barang & Harga Jual (`/barang`)**:
  - Tabel master penjualan/barang responsif dan elegan dengan 11 kolom data:
    1. Kode Barang (badge mono)
    2. Nama Barang
    3. Satuan
    4. Stok (indikator warna: merah jika < 10, amber jika < 25, hijau jika >= 25)
    5. Harga Beli
    6. HPP (Harga Pokok)
    7. Harga Bebas
    8. Harga Resep
    9. **Harga Grosir** (*Wajib tampil langsung di tabel sesuai aturan*)
    10. Status (Aktif / Nonaktif)
    11. Aksi (Edit, Soft Delete, Restore)
- **Fitur Pencarian, Filter & Pagination**:
  - Pencarian fleksibel berdasarkan nama atau kode barang
  - Filter status (Hanya Aktif, Hanya Nonaktif, Semua Barang)
  - Sorting (Nama A-Z, Nama Z-A, Kode Barang, Stok Terendah, Stok Tertinggi, Terbaru)
  - Pagination dinamis (10, 25, 50 baris per halaman)
- **Kalkulator Harga Real-Time Terpusat (`src/services/pricing.ts`)**:
  - Dihitung langsung dari parameter input (Harga Beli, Diskon %, PPN %)
  - Menghitung otomatis:
    - $\text{Harga Setelah Diskon} = \text{Harga Beli} - (\text{Harga Beli} \times \text{Diskon}\%)$
    - $\text{HPP (Harga Pokok)} = \text{Harga Setelah Diskon} + (\text{Harga Setelah Diskon} \times \text{PPN}\%)$
    - $\text{Harga Bebas}$, $\text{Harga Resep}$, $\text{Harga Grosir}$ dihitung dari markup konfigurasi dengan pembulatan fleksibel (1, 50, 100, 500)
  - **Hasil kalkulasi dapat ditimpa manual (override)** oleh Admin jika menginginkan harga khusus
- **Soft Delete & Restore (`aktif: Boolean`)**:
  - Penghapusan barang tidak menghapus rekor fisik (soft delete) untuk menjaga integritas riwayat transaksi
  - Dilengkapi dialog konfirmasi modal sebelum aksi dilakukan
  - Menyediakan filter dan tombol untuk mengaktifkan kembali (*restore*) barang nonaktif
- **Keamanan Server & Route Handler**:
  - Cek role `ADMIN` dan status user `aktif` di setiap endpoint API `/api/barang` dan `/api/pengaturan`

---

## 2. Bukti Pengujian Otomatis Browser

Pengujian otomatis dilakukan pada server lokal di `http://localhost:3002`.

### A. Tabel Master Barang & Kolom Harga Grosir
Tabel menampilkan 20 barang hasil seeder awal dengan format Rupiah `Rp 1.250.000` dan kolom **Harga Grosir** tampil langsung di tabel.

### B. Modal Tambah Barang & Kalkulator Harga Real-Time
Memasukkan Harga Beli Rp 20.000, Diskon 10%, PPN 11% menghasilkan kalkulasi HPP Rp 19.980, Harga Bebas Rp 25.000, Harga Resep Rp 27.000, dan Harga Grosir Rp 23.000 secara otomatis dan real-time.

### C. Konfirmasi Notifikasi Sukses Simpan Barang
Barang baru tersimpan dengan notifikasi toast Bahasa Indonesia yang ramah pengguna.

### D. Pencarian Barang Cepat
Memasukkan kata kunci `BRG-099` pada kolom pencarian langsung memfilter data secara instan.

### E. Dialog Konfirmasi Soft Delete
Sebelum menonaktifkan barang, muncul modal konfirmasi untuk mencegah ketidaksengajaan.

### F. Status Nonaktif dan Opsi Restore
Barang yang dinonaktifkan diberi badge abu-abu `NONAKTIF` dan tersedia tombol daya (power) untuk mengaktifkannya kembali kapan saja.

---

## 3. Status Verifikasi Unit Testing & Integrasi

- **Vitest Unit Test (`tests/pricing.test.ts`)**: 6 dari 6 pengujian lulus 100%.
- **Integration Test (`tests/test_milestone_b.ts`)**: Seluruh alur kalkulasi HPP, markup harga, override manual, soft delete, dan restore lulus 100%.

---

Milestone (b) telah selesai secara sempurna. Siap melanjutkan ke **Milestone (c): Import & Export Excel (ExcelJS)**.
