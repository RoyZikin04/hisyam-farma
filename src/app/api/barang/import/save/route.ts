import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { barisImportSchema } from "@/lib/excel";
import { z } from "zod";

const saveImportSchema = z.object({
  rows: z.array(barisImportSchema),
  updateJikaAda: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = saveImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format data penyimpanan impor tidak valid." },
        { status: 400 }
      );
    }

    const { rows, updateJikaAda } = parsed.data;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data valid untuk disimpan." },
        { status: 400 }
      );
    }

    let berhasil = 0;
    let diperbarui = 0;
    let dilewati = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of rows) {
        const existing = await tx.penjualan.findUnique({
          where: { kode_barang: item.kode_barang },
        });

        const cleanData = {
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          satuan: item.satuan,
          stok: item.stok,
          harga_beli: item.harga_beli,
          diskon_persen: item.diskon_persen,
          ppn_persen: item.ppn_persen,
          harga_pokok: item.harga_pokok,
          harga_bebas: item.harga_bebas,
          harga_resep: item.harga_resep,
          harga_grosir: item.harga_grosir,
          aktif: true,
        };

        if (existing) {
          if (updateJikaAda) {
            await tx.penjualan.update({
              where: { kode_barang: item.kode_barang },
              data: cleanData,
            });
            diperbarui++;
          } else {
            dilewati++;
          }
        } else {
          await tx.penjualan.create({
            data: cleanData,
          });
          berhasil++;
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Impor selesai: ${berhasil} barang baru disimpan, ${diperbarui} barang diperbarui, ${dilewati} barang dilewati.`,
      berhasil,
      diperbarui,
      dilewati,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal menyimpan data impor Excel:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data impor ke database." },
      { status: 500 }
    );
  }
}
