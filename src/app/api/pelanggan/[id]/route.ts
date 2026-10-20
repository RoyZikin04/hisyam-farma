import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const updatePelangganSchema = z.object({
  kode_pelanggan: z.string().trim().optional(),
  nama: z.string().trim().min(1, "Nama pelanggan wajib diisi").optional(),
  telepon: z.string().trim().optional().nullable(),
  alamat: z.string().trim().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
  aktif: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/pelanggan/[id]
 * Mengambil detail pelanggan dan riwayat transaksi belanja
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const pelanggan = await prisma.pelanggan.findUnique({
      where: { id },
      include: {
        transaksi: {
          orderBy: { tanggal: "desc" },
          take: 10,
          include: {
            items: true,
          },
        },
        _count: {
          select: { transaksi: true },
        },
      },
    });

    if (!pelanggan) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Hitung total belanja pelanggan
    const totalBelanja = pelanggan.transaksi.reduce((acc, t) => acc + t.grand_total, 0);

    return NextResponse.json({
      ...pelanggan,
      totalBelanja,
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Sesi login berakhir" }, { status: 401 });
    }
    console.error("Gagal mengambil detail pelanggan:", error);
    return NextResponse.json({ error: "Gagal mengambil data pelanggan" }, { status: 500 });
  }
}

/**
 * PUT /api/pelanggan/[id]
 * Memperbarui data profil pelanggan
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await prisma.pelanggan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updatePelangganSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data perubahan tidak valid" },
        { status: 400 }
      );
    }

    // Cek duplikasi kode jika kode diubah
    if (parsed.data.kode_pelanggan && parsed.data.kode_pelanggan !== existing.kode_pelanggan) {
      const codeExists = await prisma.pelanggan.findUnique({
        where: { kode_pelanggan: parsed.data.kode_pelanggan },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: `Kode pelanggan "${parsed.data.kode_pelanggan}" sudah digunakan.` },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.pelanggan.update({
      where: { id },
      data: {
        ...(parsed.data.kode_pelanggan ? { kode_pelanggan: parsed.data.kode_pelanggan } : {}),
        ...(parsed.data.nama ? { nama: parsed.data.nama } : {}),
        ...(parsed.data.telepon !== undefined ? { telepon: parsed.data.telepon } : {}),
        ...(parsed.data.alamat !== undefined ? { alamat: parsed.data.alamat } : {}),
        ...(parsed.data.catatan !== undefined ? { catatan: parsed.data.catatan } : {}),
        ...(parsed.data.aktif !== undefined ? { aktif: parsed.data.aktif } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data pelanggan "${updated.nama}" berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Sesi login berakhir" }, { status: 401 });
    }
    console.error("Gagal memperbarui pelanggan:", error);
    return NextResponse.json({ error: "Gagal memperbarui pelanggan" }, { status: 500 });
  }
}

/**
 * DELETE /api/pelanggan/[id]
 * Soft delete (menonaktifkan) pelanggan
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const existing = await prisma.pelanggan.findUnique({
      where: { id },
      include: { _count: { select: { transaksi: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    // Jika belum pernah ada transaksi, bisa dihapus permanen. Jika ada riwayat, soft delete (aktif: false)
    if (existing._count.transaksi === 0) {
      await prisma.pelanggan.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: `Pelanggan "${existing.nama}" berhasil dihapus.`,
      });
    } else {
      await prisma.pelanggan.update({
        where: { id },
        data: { aktif: false },
      });
      return NextResponse.json({
        success: true,
        message: `Pelanggan "${existing.nama}" memiliki riwayat transaksi dan telah dinonaktifkan.`,
      });
    }
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: "Sesi login berakhir" }, { status: 401 });
    }
    console.error("Gagal menghapus pelanggan:", error);
    return NextResponse.json({ error: "Gagal menghapus pelanggan" }, { status: 500 });
  }
}
