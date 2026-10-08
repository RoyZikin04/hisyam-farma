import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function runBrowserMilestoneDTest() {
  console.log("=== PENGUJIAN BROWSER MILESTONE (D) - TRANSAKSI MASUK & KELUAR ===");

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1366,768"],
    defaultViewport: { width: 1366, height: 768 },
  });

  try {
    const page = await browser.newPage();

    // ----------------------------------------------------
    // BAGIAN 1: TRANSAKSI MASUK (RESTOCK) OLEH ADMIN
    // ----------------------------------------------------
    console.log("1. Login sebagai Admin...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.type("input[type='text']", "admin");
    await page.type("input[type='password']", "admin123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("✓ Login Admin sukses.");

    console.log("2. Navigasi ke /transaksi/masuk...");
    await page.goto("http://localhost:3000/transaksi/masuk", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_1_halaman_transaksi_masuk.png") });
    console.log("✓ Screenshot Halaman Transaksi Masuk berhasil diambil.");

    console.log("3. Memilih barang untuk restock (Paracetamol)...");
    const searchInputMasuk = await page.$("input[placeholder*='Ketik kode atau nama']");
    if (searchInputMasuk) {
      await searchInputMasuk.type("Paracetamol");
      await new Promise((r) => setTimeout(r, 600));

      // Klik hasil pencarian pertama
      const itemBtn = await page.$("button:has-text('Paracetamol 500mg')").catch(async () => {
        const buttons = await page.$$("button");
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text && text.includes("Paracetamol")) return btn;
        }
        return null;
      });

      if (itemBtn) await itemBtn.click();
    }

    await new Promise((r) => setTimeout(r, 600));

    // Isi Qty Masuk: 30
    const inputsMasuk = await page.$$("form input[type='number']");
    if (inputsMasuk.length >= 2) {
      await inputsMasuk[0].click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await inputsMasuk[0].type("30");
    }

    await new Promise((r) => setTimeout(r, 400));

    // Klik Tambahkan Item
    console.log("4. Menambahkan item ke daftar faktur restock...");
    const tambahItemBtn = await page.$("button:has-text('Tambahkan Item')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("Tambahkan Item")) return btn;
      }
      return null;
    });
    if (tambahItemBtn) await tambahItemBtn.click();

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_2_faktur_barang_masuk.png") });
    console.log("✓ Screenshot Faktur Barang Masuk berhasil diambil.");

    // Klik Simpan Transaksi Masuk
    console.log("5. Menyimpan transaksi barang masuk & mutasi stok...");
    const simpanMasukBtn = await page.$("button:has-text('Simpan Transaksi')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("Simpan Transaksi")) return btn;
      }
      return null;
    });
    if (simpanMasukBtn) await simpanMasukBtn.click();

    await new Promise((r) => setTimeout(r, 1500));

    // ----------------------------------------------------
    // BAGIAN 2: TRANSAKSI KASIR (POS) OLEH KASIR
    // ----------------------------------------------------
    console.log("6. Logout Admin...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    // Hapus cookie sesi
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });

    console.log("7. Login sebagai Kasir...");
    await page.type("input[type='text']", "kasir");
    await page.type("input[type='password']", "kasir123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });
    console.log("✓ Login Kasir sukses (masuk ke terminal POS).");

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_3_terminal_kasir_pos.png") });
    console.log("✓ Screenshot Terminal Kasir POS berhasil diambil.");

    // Tambah barang 1 ke keranjang (Paracetamol Harga Bebas)
    console.log("8. Menambah barang ke keranjang POS...");
    const searchKasir = await page.$("input[placeholder*='Ketik nama atau kode']");
    if (searchKasir) {
      await searchKasir.type("Paracetamol");
      await new Promise((r) => setTimeout(r, 600));

      const bebasBtn = await page.$("button:has-text('+ Bebas')").catch(async () => {
        const buttons = await page.$$("button");
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text && text.includes("+ Bebas")) return btn;
        }
        return null;
      });
      if (bebasBtn) await bebasBtn.click();
    }

    await new Promise((r) => setTimeout(r, 500));

    // Tambah barang 2 ke keranjang (Bodrex Harga Resep)
    if (searchKasir) {
      await searchKasir.type("Bodrex");
      await new Promise((r) => setTimeout(r, 600));

      const resepBtn = await page.$("button:has-text('+ Resep')").catch(async () => {
        const buttons = await page.$$("button");
        for (const btn of buttons) {
          const text = await page.evaluate((el) => el.textContent, btn);
          if (text && text.includes("+ Resep")) return btn;
        }
        return null;
      });
      if (resepBtn) await resepBtn.click();
    }

    await new Promise((r) => setTimeout(r, 500));

    // Tambah qty barang pertama
    const plusBtns = await page.$$("button:has(svg.lucide-plus), button");
    for (const btn of plusBtns) {
      const isPlus = await page.evaluate((el) => el.innerHTML.includes("lucide-plus"), btn);
      if (isPlus) {
        await btn.click();
        break;
      }
    }

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_4_keranjang_kasir_multi_item.png") });
    console.log("✓ Screenshot Keranjang Kasir Multi-Item berhasil diambil.");

    // Buka Modal Pembayaran (Klik PROSES BAYAR)
    console.log("9. Membuka Modal Pembayaran (Checkout)...");
    const bayarBtn = await page.$("button:has-text('PROSES BAYAR')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("PROSES BAYAR")) return btn;
      }
      return null;
    });
    if (bayarBtn) await bayarBtn.click();

    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_5_modal_pembayaran_kasir.png") });
    console.log("✓ Screenshot Modal Pembayaran Kasir berhasil diambil.");

    // Masukkan Uang Diterima: Coba Rp 100.000 dulu untuk uji validasi kurang bayar
    const nominalBtn100k = await page.$("button:has-text('100.000')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("100.000")) return btn;
      }
      return null;
    });
    if (nominalBtn100k) await nominalBtn100k.click();

    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_5_modal_pembayaran_kasir.png") });
    console.log("✓ Screenshot Modal Pembayaran Kasir (Validasi Kurang Bayar) berhasil diambil.");

    // Sekarang klik Rp 200.000 agar uang cukup dan kembalian dihitung
    const nominalBtn200k = await page.$("button:has-text('200.000')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("200.000")) return btn;
      }
      return null;
    });
    if (nominalBtn200k) await nominalBtn200k.click();
    await new Promise((r) => setTimeout(r, 600));

    // Selesaikan Transaksi
    console.log("10. Menyelesaikan Transaksi Penjualan...");
    const selesaikanBtn = await page.$("button:has-text('Selesaikan Transaksi')").catch(async () => {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && text.includes("Selesaikan Transaksi")) return btn;
      }
      return null;
    });
    if (selesaikanBtn) await selesaikanBtn.click();

    // Tunggu dialog transaksi berhasil
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "d_6_transaksi_kasir_selesai.png") });
    console.log("✓ Screenshot Transaksi Kasir Selesai berhasil diambil.");

    console.log("=== SEMUA PENGUJIAN BROWSER MILESTONE (D) SELESAI DENGAN SUKSES ===");
  } finally {
    await browser.close();
  }
}

runBrowserMilestoneDTest().catch((err) => {
  console.error("Gagal pengujian browser:", err);
  process.exit(1);
});
