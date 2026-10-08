# Walkthrough Hasil Pengerjaan: Milestone (a) Setup + Auth + DB

Milestone (a) telah selesai dikerjakan secara menyeluruh sesuai aturan proyek dan revisi yang telah disepakati.

---

## 1. Ringkasan Pekerjaan Selesai

- **Inisialisasi Project**:
  - Next.js 15 (App Router) + TypeScript + Tailwind CSS
  - Skema Prisma SQLite terkonfigurasi dengan model: `User`, `Penjualan` (master barang), `Transaksi`, `TransaksiItem`, dan `Pengaturan`
  - Semua nilai nominal uang menggunakan tipe data `Int` rupiah murni
  - Kolom `aktif: Boolean` untuk soft delete pada tabel `penjualan` dan `users`
  - Tidak ada kolom expired date
- **Seeding Database (`prisma/seed.ts`)**:
  - 1 Akun Admin: username `admin` / password `admin123`
  - 1 Akun Kasir: username `kasir` / password `kasir123`
  - 20 Master Barang Apotek/Toko Kecil di tabel `penjualan`
  - 1 Rekor Pengaturan default toko & persentase markup
- **Layanan Logika Harga Terpusat (`src/services/pricing.ts`)**:
  - Rumus diskon, PPN, HPP, markup (bebas, resep, grosir), pembulatan (1, 50, 100, 500), subtotal, dan kembalian
  - Diuji dengan Vitest: **6 dari 6 unit test lolos 100%**
- **Autentikasi & Keamanan Lapis Ganda**:
  - Session cookie aman HTTP-Only (`sesi_pengguna`) menggunakan signed JWT (`jose`)
  - Password hashing dengan `bcryptjs`
  - In-memory rate limiting pada login (maksimal 5 kali gagal per 5 menit dengan sisa percobaan & jeda tunggu)
  - Pengecekan role dan status `aktif` di Middleware Next.js dan di Route Handler / Server-Side

---

## 2. Bukti Pengujian Browser Subagent

Pengujian otomatis dilakukan pada server lokal Next.js di `http://localhost:3000`.

### A. Tampilan Halaman Login
Halaman login estetik berbahasa Indonesia dengan tombol demo 1-klik untuk Admin dan Kasir.

---

### B. Uji Penolakan Kredensial Salah & Rate Limiting
Memasukkan password salah (`admin` / `salah123`) ditolak dengan pesan error Bahasa Indonesia dan indikator sisa percobaan mitigasi brute-force:
`Username atau password salah. (Sisa percobaan: 4)`

---

### C. Uji Login Administrator & Hak Akses Lengkap
Login berhasil dengan akun `admin` / `admin123`. Pengguna diarahkan ke Dashboard Admin (`/`) dengan seluruh navigasi admin terbuka (Dashboard, Master Barang, Barang Masuk, Kasir (POS), Daftar Struk, Import & Export, Kelola Pengguna, Pengaturan Toko).

---

### D. Uji Login Kasir & Isolasi Hak Akses (Role Restriction)
Login dengan akun `kasir` / `kasir123`. Kasir diarahkan otomatis ke terminal kasir POS (`/transaksi/kasir`), dan **menu navigasi admin disembunyikan/diblokir**. Kasir hanya memiliki akses ke terminal transaksi kasir dan riwayat struk miliknya.

---

## 3. Status Unit Testing

Hasil eksekusi `npx vitest run`:
```text
 ✓ tests/pricing.test.ts (6 tests) 4ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Duration  11.90s
```

---

Milestone (a) telah selesai dan diverifikasi secara menyeluruh. Siap melanjutkan ke **Milestone (b): CRUD Barang + Kalkulator Harga Real-time**.
