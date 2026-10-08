import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    await requireAuth();
    let pengaturan = await prisma.pengaturan.findUnique({
      where: { id: "default" },
    });

    if (!pengaturan) {
      pengaturan = await prisma.pengaturan.create({
        data: {
          id: "default",
          nama_toko: "Apotek & Toko Sehat Berkah",
          alamat: "Jl. Kesehatan Raya No. 45, Jakarta",
          telepon: "0812-3456-7890",
          footer_struk: "Terima kasih atas kepercayaan Anda. Semoga lekas sembuh!",
          default_markup_bebas: 25.0,
          default_markup_resep: 35.0,
          default_markup_grosir: 15.0,
          pembulatan: 100,
          ukuran_kertas: "80mm",
        },
      });
    }

    return NextResponse.json(pengaturan);
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal mengambil pengaturan." }, { status: 500 });
  }
}

const updatePengaturanSchema = z.object({
  nama_toko: z.string().min(1, "Nama toko wajib diisi"),
  alamat: z.string().min(1, "Alamat wajib diisi"),
  telepon: z.string().min(1, "Telepon wajib diisi"),
  footer_struk: z.string().optional().default(""),
  default_markup_bebas: z.number().min(0),
  default_markup_resep: z.number().min(0),
  default_markup_grosir: z.number().min(0),
  pembulatan: z.number().int().refine((val) => [1, 50, 100, 500].includes(val), {
    message: "Pembulatan harus 1, 50, 100, atau 500",
  }),
  ukuran_kertas: z.enum(["58mm", "80mm", "A4"]),
});

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = updatePengaturanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const updated = await prisma.pengaturan.upsert({
      where: { id: "default" },
      update: parsed.data,
      create: { id: "default", ...parsed.data },
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan toko berhasil diperbarui.",
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menyimpan pengaturan." }, { status: 500 });
  }
}
