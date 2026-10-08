import { prisma } from "@/lib/prisma";
import { hitungHargaSetelahDiskon, hitungHargaPokok, hitungKembalian } from "@/services/pricing";

export interface ItemMasukInput {
  penjualan_id: string;
  qty: number;
  harga_beli: number;
  diskon_persen?: number;
  ppn_persen?: number;
}

export interface TransaksiMasukInput {
  userId: string;
  keterangan?: string;
  items: ItemMasukInput[];
}

export interface ItemKeluarInput {
  penjualan_id: string;
  jenis_harga: "BEBAS" | "RESEP" | "GROSIR";
  qty: number;
}

export interface TransaksiKeluarInput {
  userId: string;
  nominal_bayar: number;
  keterangan?: string;
  items: ItemKeluarInput[];
}

/**
 * Membuat nomor transaksi unik otomatis berbasis tanggal dan urutan.
 * Format: TRX-IN-YYYYMMDD-XXXX atau TRX-OUT-YYYYMMDD-XXXX
 */
async function generateNoTransaksi(tipe: "MASUK" | "KELUAR"): Promise<string> {
  const prefix = tipe === "MASUK" ? "TRX-IN" : "TRX-OUT";
  const now = new Date();
  const yyyymmdd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const countToday = await prisma.transaksi.count({
    where: {
      tipe,
      tanggal: { gte: todayStart, lte: todayEnd },
    },
  });

  const urutan = String(countToday + 1).padStart(4, "0");
  return `${prefix}-${yyyymmdd}-${urutan}`;
}

/**
 * 1. PROSES TRANSAKSI MASUK (Restock Barang)
 * - Menambah stok barang di tabel penjualan.
 * - Memperbarui harga_beli dan harga_pokok (HPP) ke harga terbaru.
 * - HARGA JUAL TIDAK BERUBAH OTOMATIS (sesuai revisi 4).
 * - nominal_bayar, kembalian, jenis_harga NULLABLE (sesuai revisi 3).
 * - harga_satuan = harga_beli.
 */
export async function prosesTransaksiMasuk(input: TransaksiMasukInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Daftar barang masuk tidak boleh kosong.");
  }

  const noTransaksi = await generateNoTransaksi("MASUK");

  return await prisma.$transaction(async (tx) => {
    let grandTotal = 0;
    const rincianItems: Array<{
      penjualan_id: string;
      kode_barang: string;
      nama_barang: string;
      jenis_harga: null;
      qty: number;
      harga_satuan: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      if (item.qty <= 0) {
        throw new Error(`Qty barang masuk harus lebih besar dari 0.`);
      }
      if (item.harga_beli < 0) {
        throw new Error(`Harga beli tidak boleh minus.`);
      }

      const barang = await tx.penjualan.findUnique({
        where: { id: item.penjualan_id },
      });

      if (!barang) {
        throw new Error(`Barang dengan ID ${item.penjualan_id} tidak ditemukan.`);
      }

      const diskon = item.diskon_persen ?? 0;
      const ppn = item.ppn_persen ?? 11;

      // Hitung HPP terbaru
      const setelahDiskon = hitungHargaSetelahDiskon(item.harga_beli, diskon);
      const hppTerbaru = hitungHargaPokok(setelahDiskon, ppn);

      const subtotal = Math.round(item.qty * item.harga_beli);
      grandTotal += subtotal;

      // Update stok & harga pokok master barang (harga jual TIDAK diubah otomatis)
      await tx.penjualan.update({
        where: { id: barang.id },
        data: {
          stok: { increment: item.qty },
          harga_beli: item.harga_beli,
          diskon_persen: diskon,
          ppn_persen: ppn,
          harga_pokok: hppTerbaru,
          // harga_bebas, harga_resep, harga_grosir TETAP tidak berubah otomatis
        },
      });

      rincianItems.push({
        penjualan_id: barang.id,
        kode_barang: barang.kode_barang,
        nama_barang: barang.nama_barang,
        jenis_harga: null,
        qty: item.qty,
        harga_satuan: item.harga_beli,
        subtotal,
      });
    }

    // Buat header transaksi MASUK
    const transaksi = await tx.transaksi.create({
      data: {
        no_transaksi: noTransaksi,
        tipe: "MASUK",
        user_id: input.userId,
        grand_total: grandTotal,
        nominal_bayar: null,
        kembalian: null,
        keterangan: input.keterangan || null,
        items: {
          create: rincianItems,
        },
      },
      include: {
        items: true,
        user: { select: { id: true, nama: true, username: true } },
      },
    });

    return transaksi;
  });
}

/**
 * 2. PROSES TRANSAKSI KELUAR (Penjualan POS Kasir)
 * - Multi-item keranjang dengan jenis_harga (BEBAS / RESEP / GROSIR).
 * - Pengurangan stok ATOMIC BERSYARAT (stok >= qty) di dalam transaction (sesuai revisi 7).
 * - Menolak transaksi jika stok tidak mencukupi.
 * - Hitung total, input bayar, dan hitung kembalian otomatis.
 */
export async function prosesTransaksiKeluar(input: TransaksiKeluarInput) {
  if (!input.items || input.items.length === 0) {
    throw new Error("Keranjang belanja tidak boleh kosong.");
  }

  const noTransaksi = await generateNoTransaksi("KELUAR");

  return await prisma.$transaction(async (tx) => {
    let grandTotal = 0;
    const rincianItems: Array<{
      penjualan_id: string;
      kode_barang: string;
      nama_barang: string;
      jenis_harga: "BEBAS" | "RESEP" | "GROSIR";
      qty: number;
      harga_satuan: number;
      subtotal: number;
    }> = [];

    for (const item of input.items) {
      if (item.qty <= 0) {
        throw new Error(`Qty pembelian barang harus lebih besar dari 0.`);
      }

      const barang = await tx.penjualan.findUnique({
        where: { id: item.penjualan_id },
      });

      if (!barang) {
        throw new Error(`Barang dengan ID ${item.penjualan_id} tidak ditemukan.`);
      }

      if (!barang.aktif) {
        throw new Error(`Barang "${barang.nama_barang}" sedang dinonaktifkan.`);
      }

      // Tentukan harga satuan berdasarkan jenis harga
      let hargaSatuan = barang.harga_bebas;
      if (item.jenis_harga === "RESEP") {
        hargaSatuan = barang.harga_resep;
      } else if (item.jenis_harga === "GROSIR") {
        hargaSatuan = barang.harga_grosir;
      }

      const subtotal = Math.round(item.qty * hargaSatuan);
      grandTotal += subtotal;

      // PENGURANGAN STOK ATOMIC BERSYARAT (stok >= qty)
      // Concurrency-safe: jika ada 2 kasir checkout bersamaan, salah satu akan gagal jika stok kurang
      const updateResult = await tx.penjualan.updateMany({
        where: {
          id: barang.id,
          stok: { gte: item.qty },
        },
        data: {
          stok: { decrement: item.qty },
        },
      });

      if (updateResult.count === 0) {
        throw new Error(
          `Stok barang "${barang.nama_barang}" (${barang.kode_barang}) tidak mencukupi! Stok saat ini: ${barang.stok}, diminta: ${item.qty}.`
        );
      }

      rincianItems.push({
        penjualan_id: barang.id,
        kode_barang: barang.kode_barang,
        nama_barang: barang.nama_barang,
        jenis_harga: item.jenis_harga,
        qty: item.qty,
        harga_satuan: hargaSatuan,
        subtotal,
      });
    }

    if (input.nominal_bayar < grandTotal) {
      throw new Error(
        `Nominal bayar (Rp ${input.nominal_bayar}) kurang dari total belanja (Rp ${grandTotal}).`
      );
    }

    const kembalian = hitungKembalian(input.nominal_bayar, grandTotal);

    // Buat transaksi KELUAR
    const transaksi = await tx.transaksi.create({
      data: {
        no_transaksi: noTransaksi,
        tipe: "KELUAR",
        user_id: input.userId,
        grand_total: grandTotal,
        nominal_bayar: input.nominal_bayar,
        kembalian,
        keterangan: input.keterangan || null,
        items: {
          create: rincianItems,
        },
      },
      include: {
        items: true,
        user: { select: { id: true, nama: true, username: true } },
      },
    });

    return transaksi;
  });
}
