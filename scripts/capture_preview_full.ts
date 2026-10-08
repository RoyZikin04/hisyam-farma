import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";
const SAMPLE_EXCEL_PATH = path.join(__dirname, "sample_test_import.xlsx");

async function run() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,1000"],
    defaultViewport: { width: 1366, height: 1000 },
  });

  try {
    const page = await browser.newPage();
    await page.goto("http://localhost:3002/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    await page.goto("http://localhost:3002/import-export", { waitUntil: "networkidle0" });
    const fileInput = await page.$("input[type='file']");
    if (fileInput) await fileInput.uploadFile(SAMPLE_EXCEL_PATH);

    const previewBtn = await page.$("button[type='submit']");
    if (previewBtn) await previewBtn.click();

    await page.waitForSelector("table", { timeout: 8000 });
    await new Promise(r => setTimeout(r, 1000));

    // Scroll sedikit ke bawah agar tabel laporan gagal dan tabel valid terlihat penuh
    await page.evaluate(() => {
      window.scrollBy(0, 320);
    });
    await new Promise(r => setTimeout(r, 500));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, "c_2_tabel_detail_preview.png") });
    console.log("✓ Screenshot tabel detail preview berhasil diambil!");
  } finally {
    await browser.close();
  }
}

run().catch(console.error);
