import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const tipe = searchParams.get("tipe"); // "MASUK", "KELUAR", atau kosong
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const idsParam = searchParams.get("ids");
    const isAll = searchParams.get("all") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = isAll
      ? 1000
      : Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = isAll ? 0 : (page - 1) * limit;

    const where: any = {};

    // Pembatasan Role: Kasir HANYA melihat riwayat transaksinya sendiri
    if (user.role === "KASIR") {
      where.user_id = user.id;
    }

    if (idsParam) {
      const idList = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
      if (idList.length > 0) {
        where.id = { in: idList };
      }
    }

    if (tipe && (tipe === "MASUK" || tipe === "KELUAR")) {
      where.tipe = tipe;
    }

    if (q) {
      where.OR = [
        { no_transaksi: { contains: q } },
        { items: { some: { nama_barang: { contains: q } } } },
      ];
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggal.lte = end;
      }
    }

    const [transaksiList, total] = await Promise.all([
      prisma.transaksi.findMany({
        where,
        include: {
          user: { select: { id: true, nama: true, username: true } },
          items: true,
        },
        orderBy: { tanggal: "desc" },
        skip: idsParam ? undefined : skip,
        take: idsParam ? undefined : limit,
      }),
      prisma.transaksi.count({ where }),
    ]);

    return NextResponse.json({
      items: transaksiList,
      total,
      page,
      limit: idsParam ? total : limit,
      totalPages: idsParam ? 1 : Math.ceil(total / limit) || 1,
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal mengambil data transaksi:", error);
    return NextResponse.json(
      { error: "Gagal memuat riwayat transaksi." },
      { status: 500 }
    );
  }
}
