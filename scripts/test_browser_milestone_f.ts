import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function runBrowserMilestoneFTest() {
  console.log("=== PENGUJIAN BROWSER MILESTONE (F) - DASHBOARD & GRAFIK ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
    defaultViewport: { width: 1366, height: 768 },
  });

  try {
    const page = await browser.newPage();

    // 1. Login sebagai Admin
    console.log("1. Login sebagai Admin...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("✓ Login Admin sukses, masuk ke Dashboard.");

    // Tunggu data dashboard termuat
    await new Promise((r) => setTimeout(r, 1500));

    // 2. Screenshot Tampilan Atas Dashboard (KPI Cards)
    console.log("2. Menangkap tampilan atas Dashboard (5 KPI Cards & Header)...");
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "f_1_dashboard_utama.png") });
    console.log("✓ Screenshot f_1: Dashboard Utama & KPI Cards berhasil diambil.");

    // 3. Scroll ke Area 4 Grafik Chart.js
    console.log("3. Menangkap visualisasi 4 Grafik Analitik (Chart.js)...");
    await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main) main.scrollTop = 380;
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "f_2_grafik_analitik.png") });
    console.log("✓ Screenshot f_2: 4 Grafik Analitik Chart.js berhasil diambil.");

    // 4. Scroll ke Widget Peringatan Stok Menipis
    console.log("4. Menangkap Widget Peringatan Stok Menipis...");
    await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main) main.scrollTop = 1000;
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "f_3_tabel_stok_menipis.png") });
    console.log("✓ Screenshot f_3: Widget Peringatan Stok Menipis berhasil diambil.");

    // 5. Interaksi Filter: Klik "Bulan Ini"
    console.log("5. Menguji filter periode 'Bulan Ini'...");
    await page.evaluate(() => {
      const main = document.querySelector("main");
      if (main) main.scrollTop = 0;
    });
    await new Promise((r) => setTimeout(r, 500));

    const allButtons = await page.$$("button");
    for (const btn of allButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.trim() === "Bulan Ini") {
        await btn.click();
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "f_4_dashboard_filter_bulan_ini.png") });
    console.log("✓ Screenshot f_4: Dashboard dengan filter periode 'Bulan Ini' berhasil diambil.");

    console.log("=== SEMUA PENGUJIAN BROWSER MILESTONE (F) SELESAI DENGAN SUKSES ===");
  } finally {
    await browser.close();
  }
}

runBrowserMilestoneFTest().catch((err) => {
  console.error("Gagal pengujian browser:", err);
  process.exit(1);
});
