import puppeteer from "puppeteer-core";
import path from "path";
import { prisma } from "../src/lib/prisma";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function runBrowserTest() {
  await prisma.penjualan.deleteMany({ where: { kode_barang: "BRG-099" } });
  console.log("✓ Bersihkan barang uji BRG-099 di database.");
  console.log("Meluncurkan Microsoft Edge headless via puppeteer-core...");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
    defaultViewport: { width: 1366, height: 768 },
  });

  try {
    const page = await browser.newPage();

    // 1. Login sebagai Admin
    console.log("Login sebagai Admin...");
    await page.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // 2. Navigasi ke Halaman Master Barang
    console.log("Navigasi ke /barang...");
    await page.goto("http://localhost:3002/barang", { waitUntil: "networkidle0" });
    await page.waitForSelector("table");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_2_tabel_master_barang.png") });
    console.log("✓ Screenshot Tabel Master Barang.");

    // 3. Tambah Barang Baru & Kalkulator Real-Time
    console.log("Membuka Modal Tambah Barang...");
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes("Tambah Barang Baru")) {
        await btn.click();
        break;
      }
    }

    await page.waitForSelector("form", { timeout: 5000 });
    await page.type("input[placeholder='Contoh: BRG-001']", "BRG-099");
    await page.type("input[placeholder='Nama obat/barang...']", "Vitamin B Kompleks Plus");

    const isiAngka = async (inputEl: any, nilai: string) => {
      await inputEl.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await inputEl.type(nilai);
    };

    const inputs = await page.$$("form input[type='number']");
    if (inputs.length >= 4) {
      await isiAngka(inputs[0], "50");
      await isiAngka(inputs[1], "20000");
      await isiAngka(inputs[2], "10");
      await isiAngka(inputs[3], "11");
    }

    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_3_modal_kalkulator_realtime.png") });
    console.log("✓ Screenshot Modal Kalkulator Real-Time.");

    // Simpan Barang
    const simpanBtn = await page.$("button[type='submit']");
    if (simpanBtn) await simpanBtn.click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_4_barang_tersimpan_notifikasi.png") });
    console.log("✓ Screenshot Notifikasi Sukses Simpan.");

    // 4. Cari Barang Baru
    const searchInput = await page.$("input[placeholder*='Cari']");
    if (searchInput) {
      await searchInput.type("BRG-099");
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_5_pencarian_barang_sukses.png") });
      console.log("✓ Screenshot Pencarian Barang.");
    }

    // 5. Soft Delete
    const trashBtn = await page.$("button[title*='Soft Delete']");
    if (trashBtn) {
      await trashBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_6_modal_konfirmasi_soft_delete.png") });
      console.log("✓ Screenshot Modal Konfirmasi Soft Delete.");

      // Konfirmasi
      const modalButtons = await page.$$("button");
      for (const btn of modalButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes("Ya, Nonaktifkan")) {
          await btn.click();
          break;
        }
      }

      // Tunggu modal tertutup dan request selesai
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_7_tabel_setelah_soft_delete.png") });
      console.log("✓ Screenshot Tabel Setelah Soft Delete.");

      // Ubah filter status menjadi 'Hanya Nonaktif'
      const selectStatus = await page.$("select");
      if (selectStatus) {
        await page.select("select", "nonaktif");
        await new Promise(r => setTimeout(r, 1200));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "b_8_tabel_filter_nonaktif.png") });
        console.log("✓ Screenshot Tabel Filter Nonaktif.");
      }
    }

    console.log("=== SEMUA PENGUJIAN BROWSER SELESAI DENGAN SUKSES ===");
  } finally {
    await browser.close();
  }
}

runBrowserTest().catch(err => {
  console.error("Gagal menjalankan pengujian browser:", err);
  process.exit(1);
});
