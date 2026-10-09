# Walkthrough Hasil Pengerjaan: Milestone (g) Pengaturan Toko, Kelola Pengguna, Polish & Finalisasi

Milestone (g) telah selesai dikerjakan secara menyeluruh sesuai dengan seluruh spesifikasi teknis dan aturan bisnis. Milestone ini menyempurnakan konfigurasi sistem apotek, manajemen otorisasi pengguna, pembatasan hak akses (*Role-Based Access Control*), dan integrasi preferensi operasional toko.

---

## 1. Ringkasan Fitur yang Telah Diselesaikan

### A. Modul Pengaturan Toko & Preferensi POS
- **File Halaman**: [`src/app/(dashboard)/pengaturan/page.tsx`](file:///d:/Kuliah/Unus/src/app/(dashboard)/pengaturan/page.tsx)
- **API Handler**: [`src/app/api/pengaturan/route.ts`](file:///d:/Kuliah/Unus/src/app/api/pengaturan/route.ts)
- **Fitur Utama**:
  1. **Identitas & Profil Apotek/Toko**:
     - Nama Apotek/Toko (contoh: *Apotek & Toko Sehat Berkah*)
     - Alamat Fisik Lengkap
     - Nomor Telepon / WhatsApp
     - Pesan Footer Struk Belanja (ucapan terima kasih & doa lekas sembuh)
  2. **Default Markup Margin Kalkulator Real-time**:
     - Persentase keuntungan default untuk **Harga Bebas** (misal: 25%)
     - Persentase keuntungan default untuk **Harga Resep** (misal: 35%)
     - Persentase keuntungan default untuk **Harga Grosir** (misal: 15%)
  3. **Aturan Pembulatan Harga Otomatis**:
     - Pilihan pembulatan nominal Rupiah: Tanpa Pembulatan (1), Ke Rp 50 terdekat, Ke Rp 100 terdekat, atau Ke Rp 500 terdekat.
  4. **Default Format Kertas Cetak Struk**:
     - Pilihan ukuran kertas default: **58mm Thermal**, **80mm Thermal**, atau **A4 Lembar Faktur Kasir**.

### B. Modul Kelola Pengguna Sistem (RBAC)
- **File Halaman**: [`src/app/(dashboard)/pengguna/page.tsx`](file:///d:/Kuliah/Unus/src/app/(dashboard)/pengguna/page.tsx)
- **API Handlers**:
  - [`src/app/api/pengguna/route.ts`](file:///d:/Kuliah/Unus/src/app/api/pengguna/route.ts) (List & Create)
  - [`src/app/api/pengguna/[id]/route.ts`](file:///d:/Kuliah/Unus/src/app/api/pengguna/[id]/route.ts) (Update, Reset Password, Toggle Aktif)
- **Fitur Utama**:
  1. **Daftar Akun Pengguna**:
     - Menampilkan tabel pengguna lengkap dengan Nama, Username (@username), Badge Peran (ADMIN / KASIR), Badge Status Aktif, dan Tanggal Dibuat.
  2. **Tambah Pengguna Baru**:
     - Modal interaktif dengan validasi form (Zod): nama minimal 3 karakter, username huruf kecil/angka/garis bawah tanpa spasi, password terenkripsi aman (*bcryptjs* salt 10 rounds).
     - Pemilihan peran: `ADMIN` atau `KASIR`.
     - Toggle status akun aktif langsung saat pembuatan.
  3. **Edit Pengguna & Reset Password**:
     - Memperbarui nama lengkap, peran, dan status akun.
     - Reset password bersifat opsional (dibiarkan kosong jika tidak ingin mereset password pengguna terkait).
  4. **Proteksi Pencegahan Self-Deactivation Admin**:
     - Sistem secara ketat melarang Administrator yang sedang login untuk menonaktifkan akunnya sendiri atau menurunkan perannya ke Kasir, mencegah insiden admin terkunci dari sistem (*lockout*).

### C. Keamanan Hak Akses (Role-Based Access Control)
- **Middleware Guard**: [`src/middleware.ts`](file:///d:/Kuliah/Unus/src/middleware.ts)
- **Server Guard**: [`src/lib/auth-guard.ts`](file:///d:/Kuliah/Unus/src/lib/auth-guard.ts)
- **Pengamanan Multi-Lapis**:
  1. Pengguna dengan peran `KASIR` otomatis diarahkan (*redirect*) ke terminal POS (`/transaksi/kasir`) jika mencoba mengakses halaman administrasi (`/dashboard`, `/barang`, `/transaksi/masuk`, `/import-export`, `/pengaturan`, `/pengguna`).
  2. Seluruh Route Handler administrasi memverifikasi sesi, status aktif, dan role via database server. Jika bukan admin aktif, permintaan API diblokir dengan kode HTTP `403 Forbidden`.
  3. Endpoint `GET /api/pengaturan` diberikan izin baca untuk Kasir agar informasi nama toko dan alamat dapat tercetak pada struk belanja, sedangkan mutasi data (`PUT`) tetap diproteksi khusus Admin.
  4. Sidebar layout navigasi secara otomatis menyembunyikan menu-menu administrasi dari pandangan kasir.

---

## 2. Bukti Pengujian Unit Test (Vitest)

Rangkaian 24 unit test pada backend, pricing, kalkulator, stok, struk belanja, dan kelola pengguna dinyatakan **100% Lulus (24 passed tests)**:

```bash
 RUN  v3.2.7 D:/Kuliah/Unus

 ✓ tests/dashboard.test.ts (4 tests) 5ms
 ✓ tests/pricing.test.ts (6 tests) 8ms
 ✓ tests/pengguna.test.ts (6 tests) 9ms
 ✓ tests/struk.test.ts (4 tests) 25ms
 ✓ tests/stok.test.ts (4 tests) 109ms

 Test Files  5 passed (5)
      Tests  24 passed (24)
   Duration  1.22s
```

---

## 3. Bukti Verifikasi Browser E2E (Edge Headless)

Pengujian antarmuka menyeluruh dijalankan menggunakan Edge browser automation:

| ID Bukti | Nama File Screenshot | Deskripsi Verifikasi |
|---|---|---|
| **g-1** | `g_1_halaman_pengaturan_toko.png` | Antarmuka formulir pengaturan identitas toko, default markup, pembulatan rupiah, dan ukuran kertas struk. |
| **g-2** | `g_2_daftar_pengguna.png` | Antarmuka manajemen akun staf kasir dan administrator apotek beserta status operasionalnya. |
| **g-3** | `g_3_modal_tambah_pengguna.png` | Dialog modal penambahan pengguna baru dengan seleksi role dan status akun. |
| **g-4** | `g_4_pengguna_baru_tersimpan.png` | Notifikasi konfirmasi keberhasilan penambahan pengguna baru dan pembaruan tabel secara langsung. |
| **g-5** | `g_5_modal_edit_pengguna.png` | Dialog modal peremajaan profil pengguna dan opsi reset password akun. |
| **g-6** | `g_6_kasir_dibatasi_ke_pos.png` | Verifikasi pengalihan rute kasir: saat kasir membuka rute admin, middleware langsung mengarahkan kasir ke terminal POS dan hanya menampilkan menu yang relevan. |

---

## 4. Kesimpulan Milestone (g)
Seluruh sasaran Milestone (g) dan seluruh Milestone dalam rangkaian proyek (a sampai g) telah terselesaikan dengan sempurna tanpa ada kekurangan, memenuhi seluruh aturan kode, desain estetika, dan spesifikasi fungsional.
