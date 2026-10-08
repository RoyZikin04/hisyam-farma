import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prosesTransaksiMasuk } from "@/services/stok";
import { z } from "zod";

const transaksiMasukSchema = z.object({
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        penjualan_id: z.string().min(1, "Barang wajib dipilih"),
        qty: z.number().int().min(1, "Qty masuk minimal 1"),
        harga_beli: z.number().int().min(0, "Harga beli tidak boleh minus"),
        diskon_persen: z.number().min(0).max(100).optional().default(0),
        ppn_persen: z.number().min(0).max(100).optional().default(11),
      })
    )
    .min(1, "Minimal harus ada 1 barang masuk"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();

    const body = await request.json();
    const parsed = transaksiMasukSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data input barang masuk tidak valid" },
        { status: 400 }
      );
    }

    const hasil = await prosesTransaksiMasuk({
      userId: user.id,
      keterangan: parsed.data.keterangan,
      items: parsed.data.items,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Transaksi barang masuk "${hasil.no_transaksi}" berhasil dicatat. Stok barang telah bertambah.`,
        data: hasil,
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
    console.error("Gagal memproses transaksi barang masuk:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses transaksi barang masuk." },
      { status: 400 }
    );
  }
}
