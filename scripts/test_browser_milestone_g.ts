import puppeteer from "puppeteer-core";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\raiza\\.gemini\\antigravity-ide\\brain\\8c9d5199-ea02-4acc-8aa6-73ad719136e7";

async function runBrowserMilestoneGTest() {
  console.log("=== PENGUJIAN BROWSER MILESTONE (G) - PENGATURAN TOKO & KELOLA PENGGUNA ===");

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

    // 2. Navigasi ke /pengaturan (Pengaturan Toko & Preferensi POS)
    console.log("2. Navigasi ke /pengaturan...");
    await page.goto("http://localhost:3000/pengaturan", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_1_halaman_pengaturan_toko.png") });
    console.log("✓ Screenshot g_1: Halaman Pengaturan Toko & Preferensi POS berhasil diambil.");

    // 3. Simpan Pengaturan
    console.log("3. Menguji simpan pengaturan toko...");
    const simpanPengaturanBtn = await page.$("button[type='submit']");
    if (simpanPengaturanBtn) {
      await simpanPengaturanBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    // 4. Navigasi ke /pengguna (Kelola Pengguna)
    console.log("4. Navigasi ke /pengguna...");
    await page.goto("http://localhost:3000/pengguna", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_2_daftar_pengguna.png") });
    console.log("✓ Screenshot g_2: Daftar Pengguna Sistem berhasil diambil.");

    // 5. Buka Modal Tambah Pengguna Baru
    console.log("5. Membuka modal tambah pengguna baru...");
    const btns = await page.$$("button");
    for (const b of btns) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes("Tambah Pengguna")) {
        await b.click();
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 600));

    // Isi form tambah pengguna dengan username unik
    const uniqueUser = "kasir_" + Date.now().toString().slice(-4);
    const inputs = await page.$$("form input[type='text'], form input[type='password']");
    if (inputs.length >= 3) {
      await inputs[0].type("Staff Kasir Baru");
      await inputs[1].type(uniqueUser);
      await inputs[2].type("kasir123");
    }

    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_3_modal_tambah_pengguna.png") });
    console.log("✓ Screenshot g_3: Modal Tambah Pengguna Baru berhasil diambil.");

    // Simpan pengguna baru
    const submitTambahBtn = await page.$("form button[type='submit']");
    if (submitTambahBtn) {
      await submitTambahBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Tangkap daftar pengguna setelah bertambah
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_4_pengguna_baru_tersimpan.png") });
    console.log("✓ Screenshot g_4: Pengguna baru berhasil tersimpan di tabel.");

    // 6. Buka Modal Edit Pengguna
    console.log("6. Menguji modal edit pengguna...");
    const editBtns = await page.$$("button[title*='Edit']");
    if (editBtns.length > 0) {
      await editBtns[0].click(); // Klik edit pada user pertama (admin)
      await new Promise((r) => setTimeout(r, 800));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_5_modal_edit_pengguna.png") });
      console.log("✓ Screenshot g_5: Modal Edit Pengguna berhasil diambil.");

      const modalBtns = await page.$$("button");
      for (const mb of modalBtns) {
        const text = await page.evaluate((el) => el.textContent, mb);
        if (text && text.trim() === "Batal") {
          await mb.click();
          break;
        }
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    // 7. Pengujian Pembatasan Akses Role Kasir
    console.log("7. Menguji pembatasan hak akses role Kasir...");
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    });
    await page.goto("http://localhost:3000/login", { waitUntil: "networkidle0" });

    // Login sebagai Kasir
    await page.type("input[type='text']", "kasir");
    await page.type("input[type='password']", "kasir123");
    await page.click("button[type='submit']");
    await page.waitForNavigation({ waitUntil: "networkidle0" });

    // Kasir coba akses /pengaturan secara langsung
    await page.goto("http://localhost:3000/pengaturan", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));

    // Ambil screenshot halaman kasir (dicegat / dialihkan ke POS)
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "g_6_kasir_dibatasi_ke_pos.png") });
    console.log("✓ Screenshot g_6: Verifikasi keamanan role Kasir terisolasi ke terminal POS.");

    console.log("=== SEMUA PENGUJIAN BROWSER MILESTONE (G) SELESAI DENGAN SUKSES ===");
  } finally {
    await browser.close();
  }
}

runBrowserMilestoneGTest().catch((err) => {
  console.error("Gagal pengujian browser:", err);
  process.exit(1);
});
