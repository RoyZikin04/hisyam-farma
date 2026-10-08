import { NextRequest, NextResponse } from "next/server";
import { requireKasirOrAdmin } from "@/lib/auth";
import { prosesTransaksiKeluar } from "@/services/stok";
import { z } from "zod";

const transaksiKeluarSchema = z.object({
  nominal_bayar: z.number().int().min(0, "Nominal bayar wajib diisi"),
  keterangan: z.string().optional(),
  items: z
    .array(
      z.object({
        penjualan_id: z.string().min(1, "Barang wajib dipilih"),
        jenis_harga: z.enum(["BEBAS", "RESEP", "GROSIR"]),
        qty: z.number().int().min(1, "Qty belanja minimal 1"),
      })
    )
    .min(1, "Keranjang belanja tidak boleh kosong"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireKasirOrAdmin();

    const body = await request.json();
    const parsed = transaksiKeluarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data transaksi kasir tidak valid" },
        { status: 400 }
      );
    }

    const hasil = await prosesTransaksiKeluar({
      userId: user.id,
      nominal_bayar: parsed.data.nominal_bayar,
      keterangan: parsed.data.keterangan,
      items: parsed.data.items,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Transaksi penjualan "${hasil.no_transaksi}" berhasil diselesaikan.`,
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
    console.error("Gagal memproses transaksi kasir:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses transaksi kasir." },
      { status: 400 }
    );
  }
}
