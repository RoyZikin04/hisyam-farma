import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const barangInputSchema = z.object({
  kode_barang: z
    .string()
    .trim()
    .min(1, "Kode barang wajib diisi")
    .toUpperCase(),
  nama_barang: z.string().trim().min(1, "Nama barang wajib diisi"),
  satuan: z.string().trim().min(1, "Satuan wajib diisi"),
  stok: z.number().int().min(0, "Stok tidak boleh minus"),
  harga_beli: z.number().int().min(0, "Harga beli tidak boleh minus"),
  diskon_persen: z.number().min(0).max(100, "Diskon maksimal 100%"),
  ppn_persen: z.number().min(0).max(100, "PPN maksimal 100%"),
  harga_pokok: z.number().int().min(0, "Harga pokok tidak boleh minus"),
  harga_bebas: z.number().int().min(0, "Harga bebas tidak boleh minus"),
  harga_resep: z.number().int().min(0, "Harga resep tidak boleh minus"),
  harga_grosir: z.number().int().min(0, "Harga grosir tidak boleh minus"),
});

// GET: Mengambil daftar barang dengan pencarian, filter status, sorting, dan pagination
export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status") || "aktif"; // "aktif", "nonaktif", "semua"
    const sort = searchParams.get("sort") || "nama_asc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Filter kondisi
    const where: any = {};

    if (status === "aktif") {
      where.aktif = true;
    } else if (status === "nonaktif") {
      where.aktif = false;
    }

    if (q) {
      where.OR = [
        { kode_barang: { contains: q } },
        { nama_barang: { contains: q } },
      ];
    }

    // Pengurutan (Sorting)
    let orderBy: any = { nama_barang: "asc" };
    if (sort === "nama_desc") orderBy = { nama_barang: "desc" };
    if (sort === "kode_asc") orderBy = { kode_barang: "asc" };
    if (sort === "kode_desc") orderBy = { kode_barang: "desc" };
    if (sort === "stok_asc") orderBy = { stok: "asc" };
    if (sort === "stok_desc") orderBy = { stok: "desc" };
    if (sort === "terbaru") orderBy = { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.penjualan.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.penjualan.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal mengambil data barang:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data barang dari server." },
      { status: 500 }
    );
  }
}

// POST: Menambah barang baru (Khusus Admin)
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = barangInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data input barang tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Periksa keunikan kode barang
    const existing = await prisma.penjualan.findUnique({
      where: { kode_barang: data.kode_barang },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Kode barang "${data.kode_barang}" sudah digunakan oleh barang lain.` },
        { status: 400 }
      );
    }

    const baru = await prisma.penjualan.create({
      data: {
        ...data,
        aktif: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Barang "${baru.nama_barang}" berhasil ditambahkan.`,
        data: baru,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal menambah barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menambah data barang." },
      { status: 500 }
    );
  }
}
