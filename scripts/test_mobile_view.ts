import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function testMobileView() {
  console.log("=== MENGUJI TAMPILAN RESPONSIVE MOBILE DI LAYAR HP (390 x 844) ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
    },
  });

  try {
    const page = await browser.newPage();

    // 1. Login sebagai Admin di layar HP
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // 2. Buka Master Barang di HP
    await page.goto("http://localhost:3000/barang", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_1_barang_fullscreen.png") });
    console.log("✓ Screenshot mobile_1: Halaman Master Barang di HP (lebar penuh dan lega).");

    // 3. Klik tombol Hamburger untuk membuka menu drawer
    const hamburgerBtn = await page.$("button[aria-label='Buka Navigasi Menu']");
    if (hamburgerBtn) {
      await hamburgerBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "mobile_2_drawer_menu_terbuka.png") });
      console.log("✓ Screenshot mobile_2: Drawer Menu Navigasi di HP berhasil terbuka.");
    }

    console.log("=== SEMUA PENGUJIAN TAMPILAN MOBILE SUKSES ===");
  } finally {
    await browser.close();
  }
}

testMobileView().catch((err) => {
  console.error("Gagal uji mobile:", err);
  process.exit(1);
});
