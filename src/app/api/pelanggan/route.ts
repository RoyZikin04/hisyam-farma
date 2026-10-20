import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const pelangganSchema = z.object({
  kode_pelanggan: z.string().trim().optional(),
  nama: z.string().trim().min(1, "Nama pelanggan wajib diisi"),
  telepon: z.string().trim().optional().nullable(),
  alamat: z.string().trim().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
  aktif: z.boolean().optional().default(true),
});

/**
 * GET /api/pelanggan
 * Query params:
 * - q: cari nama, kode, nomor telepon
 * - status: "aktif" | "nonaktif" | "semua"
 * - page: halaman (default 1)
 * - limit: jumlah per halaman (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "aktif";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "aktif") {
      where.aktif = true;
    } else if (status === "nonaktif") {
      where.aktif = false;
    }

    if (q) {
      where.OR = [
        { kode_pelanggan: { contains: q } },
        { nama: { contains: q } },
        { telepon: { contains: q } },
        { alamat: { contains: q } },
      ];
    }

    const [items, total, totalSemua, totalAktif, totalNonaktif] = await Promise.all([
      prisma.pelanggan.findMany({
        where,
        include: {
          _count: {
            select: { transaksi: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.pelanggan.count({ where }),
      prisma.pelanggan.count(),
      prisma.pelanggan.count({ where: { aktif: true } }),
      prisma.pelanggan.count({ where: { aktif: false } }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      stats: {
        totalSemua,
        totalAktif,
        totalNonaktif,
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Sesi login berakhir" }, { status: 401 });
    }
    console.error("Gagal mengambil data pelanggan:", error);
    return NextResponse.json({ error: "Gagal mengambil data pelanggan" }, { status: 500 });
  }
}

/**
 * POST /api/pelanggan
 * Membuat data pelanggan baru
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = pelangganSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data pelanggan tidak valid" },
        { status: 400 }
      );
    }

    let kode = parsed.data.kode_pelanggan?.trim();

    // Jika kode tidak diisi, generate kode otomatis PLG-XXXX
    if (!kode) {
      const count = await prisma.pelanggan.count();
      let nextNum = count + 1;
      kode = `PLG-${String(nextNum).padStart(4, "0")}`;

      // Cek apakah kode sudah terpakai
      let exists = await prisma.pelanggan.findUnique({ where: { kode_pelanggan: kode } });
      while (exists) {
        nextNum++;
        kode = `PLG-${String(nextNum).padStart(4, "0")}`;
        exists = await prisma.pelanggan.findUnique({ where: { kode_pelanggan: kode } });
      }
    } else {
      const exists = await prisma.pelanggan.findUnique({ where: { kode_pelanggan: kode } });
      if (exists) {
        return NextResponse.json(
          { error: `Kode pelanggan "${kode}" sudah terdaftar.` },
          { status: 409 }
        );
      }
    }

    const pelangganBaru = await prisma.pelanggan.create({
      data: {
        kode_pelanggan: kode,
        nama: parsed.data.nama,
        telepon: parsed.data.telepon || null,
        alamat: parsed.data.alamat || null,
        catatan: parsed.data.catatan || null,
        aktif: parsed.data.aktif ?? true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pelanggan "${pelangganBaru.nama}" (${pelangganBaru.kode_pelanggan}) berhasil ditambahkan.`,
        data: pelangganBaru,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Sesi login berakhir" }, { status: 401 });
    }
    console.error("Gagal menambahkan pelanggan:", error);
    return NextResponse.json(
      { error: error.message || "Gagal menambahkan pelanggan baru" },
      { status: 500 }
    );
  }
}
