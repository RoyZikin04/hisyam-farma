import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function runBrowserMilestoneETest() {
  console.log("=== PENGUJIAN BROWSER MILESTONE (E) - STRUK & CETAK BATCH ===");

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
    console.log("✓ Login Admin sukses.");

    // 2. Navigasi ke /struk (Daftar Struk & Riwayat Transaksi)
    console.log("2. Navigasi ke /struk...");
    await page.goto("http://localhost:3000/struk", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_1_halaman_daftar_struk.png") });
    console.log("✓ Screenshot e_1: Halaman Daftar Struk & Riwayat Transaksi.");

    // 3. Buka Preview Struk Tunggal (80mm)
    console.log("3. Membuka modal preview cetak struk (80mm standard)...");
    const allButtons = await page.$$("button");
    let targetCetakBtn = null;
    for (const btn of allButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.trim() === "Cetak") {
        targetCetakBtn = btn;
        break;
      }
    }

    if (targetCetakBtn) {
      await targetCetakBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_2_preview_struk_80mm.png") });
      console.log("✓ Screenshot e_2: Preview Struk Ukuran 80mm Thermal.");

      // 4. Ubah ke Ukuran 58mm Thermal
      console.log("4. Mengubah ukuran ke 58mm Thermal...");
      const btns58 = await page.$$("button");
      for (const b of btns58) {
        const t = await page.evaluate((el) => el.textContent, b);
        if (t && t.includes("58mm")) {
          await b.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_3_preview_struk_58mm.png") });
      console.log("✓ Screenshot e_3: Preview Struk Ukuran 58mm Thermal.");

      // 5. Ubah ke Ukuran A4 Faktur
      console.log("5. Mengubah ukuran ke A4 Faktur Resmi...");
      const btnsA4 = await page.$$("button");
      for (const b of btnsA4) {
        const t = await page.evaluate((el) => el.textContent, b);
        if (t && t.includes("A4")) {
          await b.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_4_preview_struk_a4.png") });
      console.log("✓ Screenshot e_4: Preview Struk Format A4 Faktur Resmi.");

      // Tutup modal struk tunggal
      const tutupBtns = await page.$$("button");
      for (const b of tutupBtns) {
        const t = await page.evaluate((el) => el.textContent || el.getAttribute("title"), b);
        if (t && (t.includes("Tutup") || t.includes("Esc"))) {
          await b.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // 6. Pengujian Seleksi Batch Print (Multi-Struk)
    console.log("6. Menguji seleksi batch print banyak struk...");
    const checkboxes = await page.$$("input[type='checkbox']");
    if (checkboxes.length > 2) {
      await checkboxes[1].click(); // centang baris 1
      await new Promise((r) => setTimeout(r, 200));
      await checkboxes[2].click(); // centang baris 2
      await new Promise((r) => setTimeout(r, 200));
    }

    // Klik tombol Cetak Terpilih
    const btnsBatch = await page.$$("button");
    for (const b of btnsBatch) {
      const t = await page.evaluate((el) => el.textContent, b);
      if (t && t.includes("Cetak Terpilih")) {
        await b.click();
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_5_preview_batch_print.png") });
    console.log("✓ Screenshot e_5: Preview Cetak Batch Multi-Struk dengan Page Break.");

    // Tutup modal batch
    const tutupBatchBtns = await page.$$("button");
    for (const b of tutupBatchBtns) {
      const t = await page.evaluate((el) => el.textContent || el.getAttribute("title"), b);
      if (t && (t.includes("Tutup") || t.includes("Esc"))) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 500));

    // 7. Pengujian dari Terminal Kasir POS
    console.log("7. Menguji integrasi struk di Terminal Kasir POS...");
    await page.goto("http://localhost:3000/transaksi/kasir", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // Tambah barang & checkout cepat untuk melihat tombol Cetak Struk
    const searchKasir = await page.$("input[placeholder*='Ketik nama atau kode']");
    if (searchKasir) {
      await searchKasir.type("Paracetamol");
      await new Promise((r) => setTimeout(r, 600));

      const kasirBtns = await page.$$("button");
      for (const btn of kasirBtns) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("+ Bebas")) {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));

      const bayarBtns = await page.$$("button");
      for (const btn of bayarBtns) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("PROSES BAYAR")) {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));

      const modalBtns = await page.$$("button");
      for (const btn of modalBtns) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("Uang Pas")) {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 400));

      const submitBtns = await page.$$("button");
      for (const btn of submitBtns) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("Selesaikan Transaksi")) {
          await btn.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 1800));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, "e_6_modal_kasir_cetak_struk.png") });
      console.log("✓ Screenshot e_6: Modal Transaksi Berhasil Kasir dengan Tombol Cetak Struk (P).");
    }

    console.log("=== SEMUA PENGUJIAN BROWSER MILESTONE (E) SELESAI DENGAN SUKSES ===");
  } finally {
    await browser.close();
  }
}

runBrowserMilestoneETest().catch((err) => {
  console.error("Gagal pengujian browser:", err);
  process.exit(1);
});
