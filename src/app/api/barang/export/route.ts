import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportBarangExcel } from "@/lib/excel";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "semua";

    const where: any = {};
    if (status === "aktif") where.aktif = true;
    if (status === "nonaktif") where.aktif = false;

    const barangList = await prisma.penjualan.findMany({
      where,
      orderBy: { kode_barang: "asc" },
    });

    const buffer = await exportBarangExcel(barangList);

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `katalog_barang_${timestamp}.xlsx`;

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
    return NextResponse.json(
      { error: "Gagal mengekspor data barang ke Excel." },
      { status: 500 }
    );
  }
}
