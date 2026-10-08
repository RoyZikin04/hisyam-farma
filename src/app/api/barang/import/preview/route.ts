import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcelImport } from "@/lib/excel";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Mohon pilih file Excel (.xlsx) atau CSV untuk diunggah." },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file .xlsx atau .csv." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ambil daftar kode barang yang sudah ada di database
    const existing = await prisma.penjualan.findMany({
      select: { kode_barang: true },
    });
    const existingCodes = new Set(existing.map((e) => e.kode_barang.toUpperCase()));

    // Ambil pengaturan toko untuk fallback markup
    const pengaturan = await prisma.pengaturan.findUnique({
      where: { id: "default" },
    });

    const hasilPreview = await parseExcelImport(buffer, existingCodes, {
      markupBebas: pengaturan?.default_markup_bebas ?? 25,
      markupResep: pengaturan?.default_markup_resep ?? 35,
      markupGrosir: pengaturan?.default_markup_grosir ?? 15,
      pembulatan: pengaturan?.pembulatan ?? 100,
    });

    return NextResponse.json({
      success: true,
      message: `Pratinjau berhasil: ${hasilPreview.validCount} baris valid, ${hasilPreview.invalidCount} baris gagal.`,
      ...hasilPreview,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal memproses pratinjau Excel:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses pratinjau file Excel." },
      { status: 500 }
    );
  }
}
