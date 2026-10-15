import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function checkAndInitTurso() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum terisi di .env");
    process.exit(1);
  }

  console.log("Menghubungkan ke Turso di:", url);
  const client = createClient({ url, authToken });

  // 1. Cek tabel yang ada
  const tablesResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
  );
  const existingTables = tablesResult.rows.map((r) => r.name as string);
  console.log("Tabel yang ada di Turso saat ini:", existingTables);

  // 2. Buat tabel jika belum ada
  const ddlStatements = [
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "nama" TEXT NOT NULL,
      "username" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL,
      "aktif" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "penjualan" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "kode_barang" TEXT NOT NULL UNIQUE,
      "nama_barang" TEXT NOT NULL,
      "satuan" TEXT NOT NULL,
      "stok" INTEGER NOT NULL DEFAULT 0,
      "harga_beli" INTEGER NOT NULL DEFAULT 0,
      "diskon_persen" REAL NOT NULL DEFAULT 0.0,
      "ppn_persen" REAL NOT NULL DEFAULT 0.0,
      "harga_pokok" INTEGER NOT NULL DEFAULT 0,
      "harga_bebas" INTEGER NOT NULL DEFAULT 0,
      "harga_resep" INTEGER NOT NULL DEFAULT 0,
      "harga_grosir" INTEGER NOT NULL DEFAULT 0,
      "aktif" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "transaksi" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "no_transaksi" TEXT NOT NULL UNIQUE,
      "tipe" TEXT NOT NULL,
      "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "user_id" TEXT NOT NULL,
      "grand_total" INTEGER NOT NULL DEFAULT 0,
      "nominal_bayar" INTEGER,
      "kembalian" INTEGER,
      "keterangan" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "transaksi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "transaksi_item" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "transaksi_id" TEXT NOT NULL,
      "penjualan_id" TEXT NOT NULL,
      "kode_barang" TEXT NOT NULL,
      "nama_barang" TEXT NOT NULL,
      "jenis_harga" TEXT,
      "qty" INTEGER NOT NULL,
      "harga_satuan" INTEGER NOT NULL,
      "subtotal" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "transaksi_item_transaksi_id_fkey" FOREIGN KEY ("transaksi_id") REFERENCES "transaksi" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "transaksi_item_penjualan_id_fkey" FOREIGN KEY ("penjualan_id") REFERENCES "penjualan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "pengaturan" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
      "nama_toko" TEXT NOT NULL DEFAULT 'Apotek & Toko Berkah',
      "alamat" TEXT NOT NULL DEFAULT 'Jl. Sehat Makmur No. 12, Jakarta',
      "telepon" TEXT NOT NULL DEFAULT '0812-3456-7890',
      "footer_struk" TEXT NOT NULL DEFAULT 'Terima kasih atas kunjungan Anda. Semoga lekas sembuh!',
      "default_markup_bebas" REAL NOT NULL DEFAULT 25.0,
      "default_markup_resep" REAL NOT NULL DEFAULT 35.0,
      "default_markup_grosir" REAL NOT NULL DEFAULT 15.0,
      "pembulatan" INTEGER NOT NULL DEFAULT 100,
      "ukuran_kertas" TEXT NOT NULL DEFAULT '80mm',
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
  ];

  for (const sql of ddlStatements) {
    await client.execute(sql);
  }

  console.log("✓ Seluruh tabel berhasil diverifikasi/dibuat di Turso!");

  // 3. Cek apakah akun admin sudah ada
  const userCheck = await client.execute("SELECT COUNT(*) as count FROM users;");
  const count = Number(userCheck.rows[0].count);
  console.log("Jumlah user saat ini di Turso:", count);

  if (count === 0) {
    console.log("Menambahkan akun bawaan (admin & kasir) ke Turso...");
    const bcrypt = await import("bcryptjs");
    const adminPass = await bcrypt.hash("admin123", 10);
    const kasirPass = await bcrypt.hash("kasir123", 10);

    await client.execute({
      sql: `INSERT INTO users (id, nama, username, password, role, aktif, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      args: ["usr_admin_default", "Administrator Apotek", "admin", adminPass, "ADMIN"],
    });

    await client.execute({
      sql: `INSERT INTO users (id, nama, username, password, role, aktif, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      args: ["usr_kasir_default", "Kasir Utama", "kasir", kasirPass, "KASIR"],
    });

    console.log("✓ Akun admin dan kasir berhasil dibuat!");
  }

  // 4. Cek pengaturan awal
  const settingCheck = await client.execute("SELECT COUNT(*) as count FROM pengaturan;");
  if (Number(settingCheck.rows[0].count) === 0) {
    await client.execute({
      sql: `INSERT INTO pengaturan (id, nama_toko, alamat, telepon, footer_struk, default_markup_bebas, default_markup_resep, default_markup_grosir, pembulatan, ukuran_kertas, updatedAt)
            VALUES ('default', 'Apotek & Toko Sehat Berkah', 'Jl. Kesehatan Raya No. 45, Jakarta', '0812-3456-7890', 'Terima kasih atas kunjungan Anda. Semoga lekas sembuh!', 25, 35, 15, 100, '80mm', CURRENT_TIMESTAMP);`,
      args: [],
    });
    console.log("✓ Data profil pengaturan toko awal berhasil dibuat!");
  }

  // 5. Cek sampel obat awal
  const obatCheck = await client.execute("SELECT COUNT(*) as count FROM penjualan;");
  if (Number(obatCheck.rows[0].count) === 0) {
    console.log("Menambahkan sampel obat awal ke Turso...");
    const sampleObat = [
      {
        id: "brg_001",
        kode: "BRG-001",
        nama: "Paracetamol 500mg Strip",
        satuan: "Strip",
        stok: 100,
        beli: 5000,
        diskon: 0,
        ppn: 11,
        hpp: 5550,
        bebas: 7500,
        resep: 8000,
        grosir: 6500,
      },
      {
        id: "brg_002",
        kode: "BRG-002",
        nama: "Amoxicillin 500mg Box",
        satuan: "Box",
        stok: 50,
        beli: 45000,
        diskon: 5,
        ppn: 11,
        hpp: 47453,
        bebas: 60000,
        resep: 65000,
        grosir: 55000,
      },
      {
        id: "brg_003",
        kode: "BRG-003",
        nama: "Vitamin C 1000mg Strip",
        satuan: "Strip",
        stok: 80,
        beli: 12000,
        diskon: 0,
        ppn: 11,
        hpp: 13320,
        bebas: 17000,
        resep: 18000,
        grosir: 15500,
      },
    ];

    for (const b of sampleObat) {
      await client.execute({
        sql: `INSERT INTO penjualan (id, kode_barang, nama_barang, satuan, stok, harga_beli, diskon_persen, ppn_persen, harga_pokok, harga_bebas, harga_resep, harga_grosir, aktif, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
        args: [b.id, b.kode, b.nama, b.satuan, b.stok, b.beli, b.diskon, b.ppn, b.hpp, b.bebas, b.resep, b.grosir],
      });
    }
    console.log("✓ Sampel master obat awal berhasil diisi ke Turso!");
  }

  console.log("=== SEMUA PROSES DATABASE TURSO SELESAI DENGAN SUKSES! ===");
}

checkAndInitTurso().catch((err) => {
  console.error("Gagal inisialisasi Turso:", err);
  process.exit(1);
});
