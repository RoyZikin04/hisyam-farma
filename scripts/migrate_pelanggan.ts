import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

async function migratePelanggan() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("TURSO_DATABASE_URL atau TURSO_AUTH_TOKEN belum terisi di .env");
    process.exit(1);
  }

  console.log("Menghubungkan ke Turso di:", url);
  const client = createClient({ url, authToken });

  console.log("1. Memeriksa / Membuat tabel 'pelanggan'...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS "pelanggan" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "kode_pelanggan" TEXT NOT NULL UNIQUE,
      "nama" TEXT NOT NULL,
      "telepon" TEXT,
      "alamat" TEXT,
      "catatan" TEXT,
      "aktif" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("✓ Tabel 'pelanggan' siap.");

  console.log("2. Memeriksa kolom di tabel 'transaksi'...");
  const tableInfo = await client.execute("PRAGMA table_info(transaksi);");
  const columnNames = tableInfo.rows.map((r) => r.name as string);
  console.log("Kolom yang ada di 'transaksi':", columnNames);

  if (!columnNames.includes("pelanggan_id")) {
    console.log("Menambahkan kolom 'pelanggan_id' ke tabel 'transaksi'...");
    await client.execute(`ALTER TABLE "transaksi" ADD COLUMN "pelanggan_id" TEXT;`);
    console.log("✓ Kolom 'pelanggan_id' berhasil ditambahkan.");
  } else {
    console.log("✓ Kolom 'pelanggan_id' sudah ada.");
  }

  if (!columnNames.includes("nama_pelanggan")) {
    console.log("Menambahkan kolom 'nama_pelanggan' ke tabel 'transaksi'...");
    await client.execute(`ALTER TABLE "transaksi" ADD COLUMN "nama_pelanggan" TEXT DEFAULT 'Umum';`);
    console.log("✓ Kolom 'nama_pelanggan' berhasil ditambahkan.");
  } else {
    console.log("✓ Kolom 'nama_pelanggan' sudah ada.");
  }

  // 3. Seed sample pelanggan jika belum ada
  const countRes = await client.execute("SELECT COUNT(*) as count FROM pelanggan;");
  const count = Number(countRes.rows[0].count);
  console.log("Jumlah pelanggan saat ini:", count);

  if (count === 0) {
    console.log("Menambahkan sample data pelanggan...");
    await client.execute({
      sql: `INSERT INTO pelanggan (id, kode_pelanggan, nama, telepon, alamat, catatan, aktif, createdAt, updatedAt) VALUES 
        (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      args: [
        "pel_01", "PLG-0001", "Budi Santoso", "0812-3456-7890", "Jl. Mawar No. 10, Jakarta", "Pelanggan setia resep obat rutin",
        "pel_02", "PLG-0002", "Siti Aminah", "0813-9876-5432", "Jl. Melati No. 5, Jakarta", "Alergi obat golongan penisilin",
        "pel_03", "PLG-0003", "Klinik Pratama Sehat", "0821-1122-3344", "Jl. Sehat Makmur No. 8, Jakarta", "Pelanggan harga grosir / dokter"
      ],
    });
    console.log("✓ 3 data pelanggan awal berhasil ditambahkan.");
  }

  console.log("Migrasi pelanggan di Turso selesai dengan SUKSES!");
}

migratePelanggan().catch((err) => {
  console.error("Gagal migrasi:", err);
  process.exit(1);
});
