import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { z } from "zod";

const barangUpdateSchema = z.object({
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
  aktif: z.boolean().optional(),
});

// GET: Mengambil detail satu barang
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const barang = await prisma.penjualan.findUnique({
      where: { id },
    });

    if (!barang) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(barang);
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal mengambil data barang." },
      { status: 500 }
    );
  }
}

// PUT: Memperbarui data barang (Khusus Admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();
    const parsed = barangUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data input barang tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Periksa apakah barang ada
    const existing = await prisma.penjualan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Barang yang akan diubah tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika kode barang diubah, pastikan tidak bentrok dengan barang lain
    if (data.kode_barang !== existing.kode_barang) {
      const codeCheck = await prisma.penjualan.findUnique({
        where: { kode_barang: data.kode_barang },
      });
      if (codeCheck) {
        return NextResponse.json(
          { error: `Kode barang "${data.kode_barang}" sudah digunakan oleh barang lain.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.penjualan.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      message: `Data barang "${updated.nama_barang}" berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal memperbarui barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memperbarui data barang." },
      { status: 500 }
    );
  }
}

// DELETE: Soft delete barang (ubah aktif = false) atau toggle status
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.penjualan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    // Sesuai revisi 2: Barang pakai soft delete (kolom aktif), jangan hapus permanen jika sudah punya transaksi.
    // Jika barang sudah punya transaksi, WAJIB soft delete
    const updated = await prisma.penjualan.update({
      where: { id },
      data: { aktif: false },
    });

    return NextResponse.json({
      success: true,
      message: `Barang "${existing.nama_barang}" berhasil dinonaktifkan (soft delete).`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal menonaktifkan barang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menonaktifkan barang." },
      { status: 500 }
    );
  }
}

// PATCH: Mengaktifkan kembali barang yang berstatus nonaktif (restore)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.penjualan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Barang tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.penjualan.update({
      where: { id },
      data: { aktif: !existing.aktif },
    });

    const statusTeks = updated.aktif ? "diaktifkan kembali" : "dinonaktifkan";

    return NextResponse.json({
      success: true,
      message: `Barang "${existing.nama_barang}" berhasil ${statusTeks}.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal mengubah status aktif barang." },
      { status: 500 }
    );
  }
}
