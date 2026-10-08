import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const transaksi = await prisma.transaksi.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nama: true, username: true } },
        items: true,
      },
    });

    if (!transaksi) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    // Jika Kasir, hanya boleh melihat transaksinya sendiri
    if (user.role === "KASIR" && transaksi.user_id !== user.id) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda hanya dapat melihat struk transaksi Anda sendiri." },
        { status: 403 }
      );
    }

    return NextResponse.json(transaksi);
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal mengambil data transaksi." },
      { status: 500 }
    );
  }
}
