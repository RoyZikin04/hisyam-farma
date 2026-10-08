import puppeteer from "puppeteer-core";
import path from "path";
import { prisma } from "../src/lib/prisma";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";
const SAMPLE_EXCEL_PATH = path.join(__dirname, "sample_test_import.xlsx");

async function runBrowserMilestoneCTest() {
  console.log("=== PENGUJIAN BROWSER MILESTONE (C) ===");

  // Bersihkan data BRG-301 jika ada
  await prisma.penjualan.deleteMany({ where: { kode_barang: "BRG-301" } });

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
    defaultViewport: { width: 1366, height: 768 },
  });

  try {
    const page = await browser.newPage();

    // 1. Login Admin
    console.log("1. Login sebagai Admin...");
    await page.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("✓ Login Admin sukses.");

    // 2. Buka Halaman Import & Export
    console.log("2. Navigasi ke /import-export...");
    await page.goto("http://localhost:3002/import-export", { waitUntil: "networkidle0" });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "c_1_halaman_import_export.png") });
    console.log("✓ Screenshot Halaman Import & Export berhasil diambil.");

    // 3. Upload File Excel untuk Pratinjau
    console.log("3. Mengunggah file sample_test_import.xlsx...");
    const fileInput = await page.$("input[type='file']");
    if (!fileInput) throw new Error("Input file tidak ditemukan di halaman!");
    await fileInput.uploadFile(SAMPLE_EXCEL_PATH);

    await new Promise(r => setTimeout(r, 500));

    // Klik tombol Pratinjau (Preview) Data
    console.log("4. Menjalankan Pratinjau (Preview) Data...");
    const previewBtn = await page.$("button[type='submit']");
    if (previewBtn) await previewBtn.click();

    // Tunggu hasil pratinjau muncul
    await page.waitForSelector("table", { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1200));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "c_2_preview_import_validasi.png") });
    console.log("✓ Screenshot Pratinjau Validasi Baris (Laporan Gagal & Valid) berhasil diambil.");

    // 4. Klik Simpan Data ke Database
    console.log("5. Menyimpan baris data valid ke database...");
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes("Simpan ke Database")) {
        await btn.click();
        break;
      }
    }

    // Tunggu proses simpan dan notifikasi toast
    await new Promise(r => setTimeout(r, 1800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "c_3_hasil_simpan_database.png") });
    console.log("✓ Screenshot Hasil Simpan Database berhasil diambil.");

    // 5. Buka Tab Ekspor Data
    console.log("6. Berpindah ke Tab Ekspor Data (.xlsx)...");
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes("Ekspor Data")) {
        await btn.click();
        break;
      }
    }

    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "c_4_tab_ekspor_data.png") });
    console.log("✓ Screenshot Tab Ekspor Data berhasil diambil.");

    console.log("=== SEMUA PENGUJIAN BROWSER MILESTONE (C) BERHASIL ===");
  } finally {
    await browser.close();
  }
}

runBrowserMilestoneCTest().catch(err => {
  console.error("Gagal pengujian browser:", err);
  process.exit(1);
});
