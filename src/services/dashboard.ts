import { prisma } from "@/lib/prisma";

export interface DashboardFilter {
  periode?: "7hari" | "30hari" | "bulan_ini" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface TrenItem {
  tanggal: string; // YYYY-MM-DD
  label: string; // misal "01 Okt"
  penjualan: number; // Omzet transaksi KELUAR
  pengadaan: number; // Nilai transaksi MASUK
}

export interface JenisHargaStat {
  BEBAS: number;
  RESEP: number;
  GROSIR: number;
}

export interface TopBarangStat {
  nama_barang: string;
  kode_barang: string;
  total_qty: number;
  total_omzet: number;
}

export interface KasirStat {
  nama: string;
  username: string;
  total_omzet: number;
  jumlah_transaksi: number;
}

export interface BarangMenipisItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  satuan: string;
  stok: number;
  harga_pokok: number;
  harga_bebas: number;
}

export interface DashboardStatsResult {
  omzetHariIni: number;
  omzetBulanIni: number;
  estimasiProfitBulanIni: number;
  transaksiHariIni: number;
  stokMenipisCount: number;
  trenTransaksi: TrenItem[];
  penjualanJenisHarga: JenisHargaStat;
  topBarang: TopBarangStat[];
  performaKasir: KasirStat[];
  barangStokMenipis: BarangMenipisItem[];
  rentangInfo: {
    start: string;
    end: string;
  };
}

/**
 * Mengambil seluruh data statistik, metrik KPI, grafik, dan peringatan stok dashboard
 */
export async function getDashboardStats(filter: DashboardFilter = {}): Promise<DashboardStatsResult> {
  const now = new Date();

  // Waktu awal & akhir hari ini
  const startHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endHariIni = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Waktu awal & akhir bulan ini
  const startBulanIni = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endBulanIni = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Tentukan Rentang Filter untuk Grafik
  let filterStart: Date;
  let filterEnd: Date = new Date();
  filterEnd.setHours(23, 59, 59, 999);

  if (filter.startDate && filter.endDate) {
    filterStart = new Date(filter.startDate);
    filterStart.setHours(0, 0, 0, 0);
    filterEnd = new Date(filter.endDate);
    filterEnd.setHours(23, 59, 59, 999);
  } else if (filter.periode === "30hari") {
    filterStart = new Date();
    filterStart.setDate(filterStart.getDate() - 29);
    filterStart.setHours(0, 0, 0, 0);
  } else if (filter.periode === "bulan_ini") {
    filterStart = new Date(startBulanIni);
  } else {
    // Default: 7 hari terakhir
    filterStart = new Date();
    filterStart.setDate(filterStart.getDate() - 6);
    filterStart.setHours(0, 0, 0, 0);
  }

  // 1. Ambil KPI Hari Ini & Bulan Ini
  const [
    transaksiKeluarHariIni,
    transaksiKeluarBulanIni,
    barangStokMenipisList,
    stokMenipisCount,
    transaksiFilterPeriod,
  ] = await Promise.all([
    // Transaksi KELUAR Hari Ini
    prisma.transaksi.findMany({
      where: {
        tipe: "KELUAR",
        tanggal: { gte: startHariIni, lte: endHariIni },
      },
      select: { grand_total: true },
    }),

    // Transaksi KELUAR Bulan Ini beserta item dan HPP barang untuk hitung profit
    prisma.transaksi.findMany({
      where: {
        tipe: "KELUAR",
        tanggal: { gte: startBulanIni, lte: endBulanIni },
      },
      include: {
        items: {
          include: {
            penjualan: {
              select: { harga_pokok: true },
            },
          },
        },
      },
    }),

    // Daftar Barang Stok Menipis (stok <= 10)
    prisma.penjualan.findMany({
      where: {
        aktif: true,
        stok: { lte: 10 },
      },
      orderBy: { stok: "asc" },
      take: 15,
      select: {
        id: true,
        kode_barang: true,
        nama_barang: true,
        satuan: true,
        stok: true,
        harga_pokok: true,
        harga_bebas: true,
      },
    }),

    // Hitung total barang stok menipis
    prisma.penjualan.count({
      where: {
        aktif: true,
        stok: { lte: 10 },
      },
    }),

    // Seluruh transaksi dalam rentang filter untuk visualisasi grafik
    prisma.transaksi.findMany({
      where: {
        tanggal: { gte: filterStart, lte: filterEnd },
      },
      include: {
        user: { select: { id: true, nama: true, username: true } },
        items: true,
      },
      orderBy: { tanggal: "asc" },
    }),
  ]);

  // Hitung Omzet & Transaksi Hari Ini
  const omzetHariIni = transaksiKeluarHariIni.reduce((acc, t) => acc + t.grand_total, 0);
  const totalTransaksiHariIni = transaksiKeluarHariIni.length;

  // Hitung Omzet & Laba Kotor (Profit) Bulan Ini
  let omzetBulanIni = 0;
  let estimasiProfitBulanIni = 0;

  for (const trx of transaksiKeluarBulanIni) {
    omzetBulanIni += trx.grand_total;
    for (const item of trx.items) {
      const hpp = item.penjualan?.harga_pokok ?? 0;
      const profitItem = item.subtotal - hpp * item.qty;
      estimasiProfitBulanIni += profitItem;
    }
  }

  // 2. Olah Data Tren Harian (Masuk vs Keluar)
  const mapTren: { [tgl: string]: { penjualan: number; pengadaan: number; label: string } } = {};

  // Inisialisasi setiap hari dalam rentang filter agar tidak ada tanggal yang bolong
  const iterDate = new Date(filterStart);
  while (iterDate <= filterEnd) {
    const key = iterDate.toISOString().split("T")[0];
    const label = iterDate.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    mapTren[key] = { penjualan: 0, pengadaan: 0, label };
    iterDate.setDate(iterDate.getDate() + 1);
  }

  for (const trx of transaksiFilterPeriod) {
    const key = new Date(trx.tanggal).toISOString().split("T")[0];
    if (mapTren[key]) {
      if (trx.tipe === "KELUAR") {
        mapTren[key].penjualan += trx.grand_total;
      } else if (trx.tipe === "MASUK") {
        mapTren[key].pengadaan += trx.grand_total;
      }
    }
  }

  const trenTransaksi: TrenItem[] = Object.keys(mapTren)
    .sort()
    .map((k) => ({
      tanggal: k,
      label: mapTren[k].label,
      penjualan: mapTren[k].penjualan,
      pengadaan: mapTren[k].pengadaan,
    }));

  // 3. Olah Penjualan per Jenis Harga (Khusus Transaksi KELUAR)
  const penjualanJenisHarga: JenisHargaStat = {
    BEBAS: 0,
    RESEP: 0,
    GROSIR: 0,
  };

  // 4. Olah Top 10 Barang Terlaris
  const mapTopBarang: { [kode: string]: { nama_barang: string; total_qty: number; total_omzet: number } } = {};

  // 5. Olah Kinerja Kasir
  const mapKasir: { [userId: string]: { nama: string; username: string; total_omzet: number; jumlah_transaksi: number } } = {};

  for (const trx of transaksiFilterPeriod) {
    if (trx.tipe === "KELUAR") {
      // Akumulasi Kasir
      const uId = trx.user_id;
      if (!mapKasir[uId]) {
        mapKasir[uId] = {
          nama: trx.user?.nama || "Kasir",
          username: trx.user?.username || "-",
          total_omzet: 0,
          jumlah_transaksi: 0,
        };
      }
      mapKasir[uId].total_omzet += trx.grand_total;
      mapKasir[uId].jumlah_transaksi += 1;

      // Akumulasi Jenis Harga & Top Barang
      for (const item of trx.items) {
        const jenis = (item.jenis_harga || "BEBAS").toUpperCase() as "BEBAS" | "RESEP" | "GROSIR";
        if (jenis in penjualanJenisHarga) {
          penjualanJenisHarga[jenis] += item.subtotal;
        } else {
          penjualanJenisHarga.BEBAS += item.subtotal;
        }

        const kBrg = item.kode_barang;
        if (!mapTopBarang[kBrg]) {
          mapTopBarang[kBrg] = {
            nama_barang: item.nama_barang,
            total_qty: 0,
            total_omzet: 0,
          };
        }
        mapTopBarang[kBrg].total_qty += item.qty;
        mapTopBarang[kBrg].total_omzet += item.subtotal;
      }
    }
  }

  const topBarang: TopBarangStat[] = Object.keys(mapTopBarang)
    .map((k) => ({
      kode_barang: k,
      nama_barang: mapTopBarang[k].nama_barang,
      total_qty: mapTopBarang[k].total_qty,
      total_omzet: mapTopBarang[k].total_omzet,
    }))
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 10);

  const performaKasir: KasirStat[] = Object.values(mapKasir).sort(
    (a, b) => b.total_omzet - a.total_omzet
  );

  return {
    omzetHariIni,
    omzetBulanIni,
    estimasiProfitBulanIni,
    transaksiHariIni: totalTransaksiHariIni,
    stokMenipisCount,
    trenTransaksi,
    penjualanJenisHarga,
    topBarang,
    performaKasir,
    barangStokMenipis: barangStokMenipisList,
    rentangInfo: {
      start: filterStart.toISOString().split("T")[0],
      end: filterEnd.toISOString().split("T")[0],
    },
  };
}
