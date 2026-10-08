# Aturan Proyek: Sistem Penjualan & Stok Barang
- Semua UI, label, pesan error, dan komentar kode memakai Bahasa Indonesia. Format uang: Rp 1.250.000.
- Stack tetap: Next.js (App Router) + TypeScript + Tailwind CSS + Prisma + SQLite (dev, mudah dipindah ke PostgreSQL) + Chart.js + SheetJS (xlsx).
- Seluruh logika harga ada di SATU file service (src/services/pricing.ts), tidak boleh diduplikasi di komponen UI.
- Hak akses role (admin/kasir) wajib dicek di server (middleware/route handler), bukan hanya disembunyikan di UI.
- Jangan menambah fitur di luar yang diminta. Jangan meninggalkan TODO/placeholder kosong.
- Setiap milestone selesai: jalankan aplikasi, uji lewat browser, perbaiki error, baru lapor.
- Tidak ada kolom expired date.