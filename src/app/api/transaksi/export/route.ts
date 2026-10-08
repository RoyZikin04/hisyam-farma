import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportTransaksiExcel } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const tipe = searchParams.get("tipe"); // "MASUK", "KELUAR", atau kosong/semua

    const where: any = {};

    if (tipe && (tipe === "MASUK" || tipe === "KELUAR")) {
      where.tipe = tipe;
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = new Date(startDate);
      }
      if (endDate) {
        // Set sampai akhir hari (23:59:59.999)
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggal.lte = end;
      }
    }

    const transaksiList = await prisma.transaksi.findMany({
      where,
      include: {
        user: { select: { nama: true } },
        items: true,
      },
      orderBy: { tanggal: "desc" },
    });

    const buffer = await exportTransaksiExcel(transaksiList, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `laporan_transaksi_${timestamp}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal mengekspor data transaksi:", error);
    return NextResponse.json(
      { error: "Gagal mengekspor riwayat transaksi ke Excel." },
      { status: 500 }
    );
  }
}
