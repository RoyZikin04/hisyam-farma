# Walkthrough Hasil Pengerjaan: Milestone (f) Dashboard & Grafik

Milestone (f) telah selesai dikerjakan secara menyeluruh sesuai dengan seluruh spesifikasi bisnis dan aturan teknis.

---

## 1. Ringkasan Fitur yang Telah Diselesaikan

### A. Layanan Kalkulasi Statistik Dashboard (`src/services/dashboard.ts`)
- **Metrik KPI Utama**:
  - **Omzet Hari Ini**: Akumulasi nilai penjualan POS (transaksi KELUAR) pada tanggal hari ini.
  - **Omzet Bulan Ini**: Akumulasi total penerimaan penjualan POS pada bulan kalender berjalan.
  - **Estimasi Laba Kotor (Profit)**: Dihitung secara presisi per transaksi:
    $$\text{Laba Kotor} = \sum (\text{Subtotal Item} - (\text{HPP} \times \text{Qty}))$$
  - **Transaksi Hari Ini**: Total jumlah struk belanja kasir yang sukses dilayani hari ini.
  - **Peringatan Stok Menipis**: Deteksi otomatis jumlah barang aktif dengan sisa stok $\le 10$ unit.
- **Pengolahan Visualisasi Grafik**:
  - Agregasi tren harian (Penjualan vs Pengadaan) tanpa celah tanggal (*zero-fill gap dates*).
  - Distribusi omzet berdasarkan variasi tier harga: **Bebas**, **Resep**, dan **Grosir**.
  - Peringkat 10 barang terlaris berdasarkan total kuantitas unit terjual beserta omzetnya.
  - Kinerja dan kontribusi omzet per kasir/petugas.

### B. Endpoint API Terpadu (`GET /api/dashboard/stats`)
- Endpoint terlindungi server guard `requireAdmin()`.
- Mendukung filter periode dinamis via query params:
  - `7hari`: 7 hari terakhir (default)
  - `30hari`: 30 hari terakhir
  - `bulan_ini`: Awal bulan berjalan hingga hari ini
  - `custom`: Rentang tanggal manual (`startDate` dan `endDate`).

### C. Komponen Visualisasi Grafik Modern (Chart.js & react-chartjs-2)
1. **[`GrafikTrenTransaksi.tsx`](file:///d:/Kuliah/Unus/src/components/dashboard/GrafikTrenTransaksi.tsx)**:
   - Line chart membandingkan kurva **Penjualan POS (Keluar)** berwarna emerald dan **Pengadaan Restock (Masuk)** bergaris putus-putus biru langit.
   - Sumbu Y terformat rapi dalam jutaan/ribuan Rupiah dan tooltip interaktif.
2. **[`GrafikJenisHarga.tsx`](file:///d:/Kuliah/Unus/src/components/dashboard/GrafikJenisHarga.tsx)**:
   - Doughnut chart elegan dengan cutout modern dan ringkasan total omzet di tengah diagram.
   - Menampilkan proporsi nominal dan persentase penjualan untuk Harga Bebas, Resep, dan Grosir.
3. **[`GrafikTopBarang.tsx`](file:///d:/Kuliah/Unus/src/components/dashboard/GrafikTopBarang.tsx)**:
   - Horizontal bar chart menampilkan 10 obat/barang terlaris dengan label rapi dan tooltip rincian omzet.
4. **[`GrafikPerformaKasir.tsx`](file:///d:/Kuliah/Unus/src/components/dashboard/GrafikPerformaKasir.tsx)**:
   - Bar chart komparasi omzet penjualan antar kasir/petugas.
5. **[`TabelStokMenipis.tsx`](file:///d:/Kuliah/Unus/src/components/dashboard/TabelStokMenipis.tsx)**:
   - Widget peringatan stok dengan badge warna cerdas:
     - Badge Merah untuk stok kosong ($0$ unit / HABIS).
     - Badge Amber/Kuning untuk stok menipis ($1 - 10$ unit).
   - Tautan aksi langsung ke modul pengadaan barang masuk (`/transaksi/masuk`).

---

## 2. Bukti Pengujian Unit Test (Vitest)

Sebanyak 18 pengujian backend, pricing, stok, struk, dan dashboard dinyatakan **100% lulus (18 passed tests)**:

```bash
 ✓ tests/dashboard.test.ts (4 tests)
   ✓ Menghitung estimasi laba kotor: subtotal - (HPP * qty)
   ✓ Mengelompokkan dan mengurutkan Top Barang Terlaris berdasarkan kuantitas terbanyak
   ✓ Mengagregasi penjualan per jenis harga (Bebas, Resep, Grosir)
   ✓ Mendeteksi barang stok menipis (stok <= 10) dan membedakan stok habis (0)
 ✓ tests/pricing.test.ts (6 tests)
 ✓ tests/struk.test.ts (4 tests)
 ✓ tests/stok.test.ts (4 tests)

Test Files  4 passed (4)
     Tests  18 passed (18)
```

---

## 3. Bukti Pengujian Otomatis Browser

Tangkapan layar verifikasi disimpan di folder artifacts:
- `f_1_dashboard_utama.png`: Tampilan atas dashboard dengan 5 kartu KPI metrik apotek
- `f_2_grafik_analitik.png`: Visualisasi 4 grafik analitik Chart.js (Tren Penjualan/Restock, Jenis Harga, Top 10 Barang, Kinerja Kasir)
- `f_3_tabel_stok_menipis.png`: Widget tabel peringatan stok obat menipis (badge merah stok 0 dan badge kuning stok 4)
- `f_4_dashboard_filter_bulan_ini.png`: Interaktivitas filter rentang waktu periode "Bulan Ini"

---

## 4. Status Milestone

| Komponen | Status | Catatan |
|---|---|---|
| Kartu KPI (Omzet, Profit, Transaksi, Stok) | **Selesai** | Dihitung real-time dari transaksi database |
| Grafik Tren (Masuk vs Keluar) | **Selesai** | Line chart perbandingan arus omzet dan pengadaan |
| Grafik Jenis Harga (Bebas/Resep/Grosir) | **Selesai** | Doughnut chart dengan total di tengah |
| Grafik Top 10 Barang Terlaris | **Selesai** | Horizontal bar chart kuantitas unit terjual |
| Grafik Kinerja Kasir | **Selesai** | Bar chart omzet per kasir |
| Widget Stok Menipis | **Selesai** | Badge merah (0) & kuning (≤10), link restock |
| Unit Tests (Vitest) | **18 / 18 Lulus** | Menguji formula laba, agregasi, dan ranking |
| Uji Browser Otomatis | **Selesai** | 4 tangkapan layar verifikasi berhasil diambil |
