import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PUBLIC_ICONS_DIR = path.join(process.cwd(), "public", "icons");

async function generatePwaIcons() {
  console.log("=== MEMBUAT IKON PWA RESMI (192x192, 512x512, APPLE ICON) ===");

  if (!fs.existsSync(PUBLIC_ICONS_DIR)) {
    fs.mkdirSync(PUBLIC_ICONS_DIR, { recursive: true });
  }

  const svgPath = path.join(PUBLIC_ICONS_DIR, "icon.svg");
  const svgContent = fs.readFileSync(svgPath, "utf-8");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const sizes = [
    { name: "icon-192x192.png", size: 192 },
    { name: "icon-512x512.png", size: 512 },
    { name: "icon-maskable-512x512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32x32.png", size: 32 },
  ];

  try {
    for (const item of sizes) {
      const page = await browser.newPage();
      await page.setViewport({ width: item.size, height: item.size });
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent; }
              svg { width: 100%; height: 100%; display: block; }
            </style>
          </head>
          <body>${svgContent}</body>
        </html>
      `;
      await page.setContent(html, { waitUntil: "networkidle0" });
      const outPath = path.join(PUBLIC_ICONS_DIR, item.name);
      await page.screenshot({ path: outPath, omitBackground: true });
      await page.close();
      console.log(`✓ Berhasil membuat: ${item.name} (${item.size}x${item.size})`);
    }

    // Salin apple-touch-icon ke public/apple-touch-icon.png
    fs.copyFileSync(
      path.join(PUBLIC_ICONS_DIR, "apple-touch-icon.png"),
      path.join(process.cwd(), "public", "apple-touch-icon.png")
    );
    console.log("✓ Berhasil menyalin apple-touch-icon.png ke root public");

    console.log("=== SEMUA IKON PWA BERHASIL DIBUAT DENGAN SEMPURNA ===");
  } finally {
    await browser.close();
  }
}

generatePwaIcons().catch((err) => {
  console.error("Gagal membuat ikon:", err);
  process.exit(1);
});
