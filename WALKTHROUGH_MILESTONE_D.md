# Walkthrough Hasil Pengerjaan: Milestone (d) Transaksi Masuk & Keluar (POS)

Milestone (d) telah selesai dikerjakan secara menyeluruh sesuai dengan seluruh spesifikasi bisnis dan aturan revisi teknis.

---

## 1. Ringkasan Fitur yang Telah Diselesaikan

### A. Backend Mutasi Stok Atomik Bersyarat (`src/services/stok.ts`)
- **Transaksi Masuk (Restock Inventori - `prosesTransaksiMasuk`)**:
  - Penomoran transaksi unik otomatis dengan format: `TRX-IN-YYYYMMDD-XXXX`.
  - Mengupdate stok barang secara aman di dalam Prisma Transaction.
  - Saat harga beli baru dimasukkan, **HPP (Harga Pokok Penjualan) diperbarui otomatis** menggunakan formula terpusat `hitungHargaPokok(hargaBeli, diskon, ppn)`.
  - **Sesuai Aturan Revisi**: Harga jual (`harga_bebas`, `harga_resep`, `harga_grosir`) **TIDAK berubah otomatis** saat restock; margin dan harga jual tetap dikendalikan oleh admin melalui master kalkulator.
  - Kolom `nominal_bayar`, `kembalian`, dan `jenis_harga` tersimpan sebagai `null` khusus untuk transaksi masuk.
- **Transaksi Keluar (Penjualan Kasir POS - `prosesTransaksiKeluar`)**:
  - Penomoran transaksi unik otomatis dengan format: `TRX-OUT-YYYYMMDD-XXXX`.
  - **Pencegahan Race Condition Stok Minus**: Pengurangan stok menggunakan pembaruan bersyarat atomik database:
    ```typescript
    const updateResult = await tx.penjualan.updateMany({
      where: {
        id: item.penjualan_id,
        stok: { gte: item.qty }, // Hanya kurangi jika stok mencukupi
      },
      data: {
        stok: { decrement: item.qty },
      },
    });
    if (updateResult.count === 0) {
      throw new Error(`Stok untuk "${item.nama_barang}" tidak mencukupi...`);
    }
    ```
  - Jika stok tidak mencukupi, seluruh transaksi dibatalkan (rollback) seketika dengan pesan error yang jelas.
  - Validasi pembayaran: Nominal bayar tidak boleh kurang dari grand total, dengan kalkulasi kembalian presisi integer Rupiah.

### B. Endpoint API Terpadu
- `POST /api/transaksi/masuk`: Khusus `ADMIN`, mencatat restock barang, mutasi stok bertambah, dan pembaruan HPP.
- `POST /api/transaksi/keluar`: Dapat diakses oleh `KASIR` dan `ADMIN`, memproses penjualan multi-item, jenis harga fleksibel, dan pengurangan stok atomik.
- `GET /api/transaksi`: Mengambil riwayat transaksi dengan filter tipe (`MASUK` / `KELUAR`), pencarian, dan rentang tanggal.
- `GET /api/transaksi/[id]`: Mengambil rincian faktur transaksi dan daftar item barang.

### C. Antarmuka Transaksi Masuk (`/transaksi/masuk`)
- Autocomplete pencarian obat/barang berbasis kode atau nama barang.
- Form masukan kuantitas, harga beli baru, diskon persen, PPN persen, dan pratinjau kalkulasi HPP baru secara real-time.
- Rincian faktur multi-item barang masuk dengan kalkulasi subtotal dan grand total restock.
- Input catatan / nomor faktur supplier PBF.

### D. Terminal Kasir POS Modern (`/transaksi/kasir`)
- Desain visual emerald elegan dan ergonomis untuk kasir toko/apotek.
- **Pintasan Keyboard Terpadu**:
  - `F2`: Fokus langsung ke kolom pencarian obat/barang.
  - `F9`: Membuka modal pembayaran kasir secara cepat.
  - `Esc`: Menutup modal pencarian/pembayaran.
  - `Enter`: Buka transaksi baru setelah struk selesai.
- **Dukungan Multi-Tier Harga**:
  - Tombol instan pemilihan harga pada hasil pencarian: `+ Bebas`, `+ Resep`, dan `+ Grosir`.
  - Dropdown interaktif di tabel keranjang untuk mengganti jenis harga sewaktu-waktu.
- Pengaturan kuantitas barang (+ / - / ubah langsung / hapus item) dengan indikator batas stok sisa.
- **Modal Pembayaran Lengkap**:
  - Tombol preset nominal pecahan rupiah cepat: **Uang Pas**, **Rp 20.000**, **Rp 50.000**, **Rp 100.000**, **Rp 200.000**, dan **Rp 500.000**.
  - Validasi nominal uang diterima secara real-time dengan pesan kekurangan bayar dan tombol selesai yang terkunci jika uang kurang.
  - Tampilan kembalian real-time.
- Dialog penyelesaian transaksi dengan nomor transaksi resmi dan tombol transaksi baru.

---

## 2. Bukti Pengujian Unit (Vitest)

Pengujian backend unit test dijalankan dengan hasil **100% lulus (10 passed tests)**:

```bash
 ✓ tests/pricing.test.ts (6 tests)
   ✓ hitungHargaPokok: menghitung HPP dengan diskon dan PPN
   ✓ hitungHargaJual: menghitung harga jual dengan pembulatan
   ✓ hitungSemuaHargaJual: menghitung harga bebas, resep, dan grosir
   ✓ pembulatanHarga: menguji opsi pembulatan 1, 50, 100, 500
   ✓ validasiHargaInput: memastikan nilai negatif ditolak
   ✓ formatRupiah: format angka ke string mata uang Indonesia

 ✓ tests/stok.test.ts (4 tests)
   ✓ prosesTransaksiMasuk: menambah stok dan update HPP tanpa mengubah harga jual
   ✓ prosesTransaksiKeluar: mengurangi stok dan validasi pembayaran
   ✓ prosesTransaksiKeluar: menolak transaksi jika stok tidak mencukupi (atomic conditional)
   ✓ prosesTransaksiKeluar: menolak pembayaran yang kurang dari grand total

Test Files  2 passed (2)
     Tests  10 passed (10)
```

---

## 3. Bukti Pengujian Otomatis Browser

Tangkapan layar verifikasi berhasil disimpan di folder artifacts:
- `d_1_halaman_transaksi_masuk.png`: Halaman input barang masuk restock
- `d_2_faktur_barang_masuk.png`: Faktur rincian barang masuk dengan perhitungan HPP otomatis
- `d_3_terminal_kasir_pos.png`: Terminal kasir POS dengan panduan pintasan keyboard
- `d_4_keranjang_kasir_multi_item.png`: Keranjang belanja kasir multi-item dengan multi-tier harga
- `d_5_modal_pembayaran_kasir.png`: Modal pembayaran dengan validasi uang kurang
- `d_6_transaksi_kasir_selesai.png`: Dialog transaksi berhasil, nomor struk resmi, dan kembalian

---

## 4. Status Milestone

| Komponen | Status | Catatan |
|---|---|---|
| Transaksi Masuk (Restock) | **Selesai** | Stok bertambah, HPP terupdate, harga jual tidak berubah |
| Transaksi Keluar (POS Kasir) | **Selesai** | Multi-item, 3 jenis harga, pengurangan stok atomik bersyarat |
| Validasi Stok & Pembayaran | **Selesai** | Tolak stok minus secara atomik & tolak pembayaran kurang |
| Pintasan Keyboard Kasir | **Selesai** | F2 (Cari), F9 (Bayar), Esc (Tutup), Enter (Transaksi baru) |
| Unit Tests (Vitest) | **10 / 10 Lulus** | Menguji kalkulasi dan atomisitas mutasi stok |
| Uji Browser Otomatis | **Selesai** | 6 tangkapan layar verifikasi berhasil diambil |
