import React from "react";
import { formatRupiah, formatTanggalWaktu } from "@/lib/format";

export interface TransaksiItemData {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jenis_harga?: string | null;
  qty: number;
  harga_satuan: number;
  subtotal: number;
}

export interface TransaksiData {
  id: string;
  no_transaksi: string;
  tipe: "MASUK" | "KELUAR" | string;
  tanggal: string | Date;
  grand_total: number;
  nominal_bayar?: number | null;
  kembalian?: number | null;
  keterangan?: string | null;
  user?: {
    nama: string;
    username: string;
  } | null;
  items: TransaksiItemData[];
}

export interface PengaturanTokoData {
  nama_toko: string;
  alamat: string;
  telepon: string;
  footer_struk: string;
}

interface StrukViewProps {
  transaksi: TransaksiData;
  pengaturan?: PengaturanTokoData;
  ukuran?: "58mm" | "80mm" | "A4";
  isBatch?: boolean;
}

export default function StrukView({
  transaksi,
  pengaturan = {
    nama_toko: "Apotek & Toko Berkah",
    alamat: "Jl. Kesehatan Raya No. 45, Jakarta",
    telepon: "0812-3456-7890",
    footer_struk: "Terima kasih atas kunjungan Anda. Semoga lekas sembuh!",
  },
  ukuran = "80mm",
  isBatch = false,
}: StrukViewProps) {
  const isKeluar = transaksi.tipe === "KELUAR";

  // ==========================================
  // 1. TAMPILAN FORMAT A4 (FAKTUR FORMAL)
  // ==========================================
  if (ukuran === "A4") {
    return (
      <div
        className={`struk-item ${
          isBatch ? "struk-page-break" : ""
        } bg-white text-slate-900 p-8 w-full max-w-4xl mx-auto border border-slate-200 print:border-none print:p-6 print:m-0 print:max-w-none text-sm`}
      >
        {/* Kop Faktur */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              {pengaturan.nama_toko}
            </h1>
            <p className="text-slate-600 text-xs mt-1">{pengaturan.alamat}</p>
            <p className="text-slate-600 text-xs">Telp: {pengaturan.telepon}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold tracking-wider text-emerald-800 uppercase">
              {isKeluar ? "FAKTUR PENJUALAN" : "BUKTI PENERIMAAN BARANG"}
            </h2>
            <p className="font-mono font-semibold text-slate-700 text-sm mt-1">
              {transaksi.no_transaksi}
            </p>
            <p className="text-xs text-slate-500">
              {formatTanggalWaktu(transaksi.tanggal)}
            </p>
          </div>
        </div>

        {/* Informasi Transaksi */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="text-slate-500">Petugas / Kasir:</span>{" "}
            <strong className="text-slate-800 font-medium">
              {transaksi.user?.nama || "Kasir"} (@{transaksi.user?.username || "-"})
            </strong>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Status Pembayaran:</span>{" "}
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                isKeluar
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {isKeluar ? "LUNAS (KASIR)" : "TERCATAT (RESTOCK)"}
            </span>
          </div>
          {transaksi.keterangan && (
            <div className="col-span-2 border-t border-slate-200 pt-2 text-slate-600">
              <span className="text-slate-500">Keterangan / Faktur Supplier:</span>{" "}
              {transaksi.keterangan}
            </div>
          )}
        </div>

        {/* Tabel Rincian Item */}
        <table className="w-full border-collapse border border-slate-300 text-xs mb-6">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-300 p-2 text-center w-10">No</th>
              <th className="border border-slate-300 p-2 text-left w-28">Kode</th>
              <th className="border border-slate-300 p-2 text-left">Nama Barang</th>
              {isKeluar && (
                <th className="border border-slate-300 p-2 text-center w-24">Jenis Harga</th>
              )}
              <th className="border border-slate-300 p-2 text-center w-16">Qty</th>
              <th className="border border-slate-300 p-2 text-right w-28">Harga Satuan</th>
              <th className="border border-slate-300 p-2 text-right w-32">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {transaksi.items.map((item, index) => (
              <tr key={item.id || index} className="border-b border-slate-200 hover:bg-slate-50/50">
                <td className="border border-slate-300 p-2 text-center text-slate-500">
                  {index + 1}
                </td>
                <td className="border border-slate-300 p-2 font-mono text-slate-600">
                  {item.kode_barang}
                </td>
                <td className="border border-slate-300 p-2 font-medium text-slate-800">
                  {item.nama_barang}
                </td>
                {isKeluar && (
                  <td className="border border-slate-300 p-2 text-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {item.jenis_harga || "BEBAS"}
                    </span>
                  </td>
                )}
                <td className="border border-slate-300 p-2 text-center font-bold">
                  {item.qty}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono">
                  {formatRupiah(item.harga_satuan)}
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-800">
                  {formatRupiah(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Ringkasan & Tanda Tangan */}
        <div className="flex justify-between items-start gap-8">
          <div className="w-1/2 space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 italic">
              {pengaturan.footer_struk}
              <div className="mt-1 font-semibold not-italic text-slate-700">
                * Barang yang sudah dibeli tidak dapat dikembalikan / ditukar tanpa persetujuan apotek.
              </div>
            </div>

            <div className="grid grid-cols-2 text-center pt-4 text-xs">
              <div>
                <p className="text-slate-500 mb-12">Penerima / Pelanggan</p>
                <p className="border-t border-slate-400 pt-1 font-medium mx-4">
                  ( ............................ )
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-12">Kasir / Petugas</p>
                <p className="border-t border-slate-400 pt-1 font-medium mx-4">
                  ( {transaksi.user?.nama || "Petugas"} )
                </p>
              </div>
            </div>
          </div>

          <div className="w-1/2 max-w-sm space-y-2 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-slate-700">
              <span>Total Belanja:</span>
              <span className="font-bold text-base font-mono text-slate-900">
                {formatRupiah(transaksi.grand_total)}
              </span>
            </div>
            {isKeluar && (
              <>
                <div className="flex justify-between items-center text-slate-600 text-xs border-t border-slate-200 pt-2">
                  <span>Nominal Tunai (Bayar):</span>
                  <span className="font-mono">{formatRupiah(transaksi.nominal_bayar)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-emerald-800 text-sm border-t border-slate-200 pt-2">
                  <span>Kembalian:</span>
                  <span className="font-mono">{formatRupiah(transaksi.kembalian)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. TAMPILAN FORMAT THERMAL 58mm (COMPACT)
  // ==========================================
  if (ukuran === "58mm") {
    return (
      <div
        className={`struk-item ${
          isBatch ? "struk-page-break" : ""
        } bg-white text-black p-2 font-mono text-[10.5px] leading-tight w-[220px] mx-auto shadow-md print:shadow-none print:w-[58mm] print:p-0 print:m-0`}
      >
        {/* Header Toko */}
        <div className="text-center pb-1">
          <h3 className="font-bold uppercase text-[12px]">{pengaturan.nama_toko}</h3>
          <p className="text-[9.5px] leading-tight">{pengaturan.alamat}</p>
          <p className="text-[9.5px]">Telp: {pengaturan.telepon}</p>
        </div>

        <div className="border-b border-dashed border-black my-1" />

        {/* Metadata Struk */}
        <div className="text-[9.5px] space-y-0.5">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-bold">{transaksi.no_transaksi}</span>
          </div>
          <div className="flex justify-between">
            <span>Tgl:</span>
            <span>{formatTanggalWaktu(transaksi.tanggal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kasir:</span>
            <span>{transaksi.user?.nama || "Kasir"}</span>
          </div>
          <div className="flex justify-between">
            <span>Tipe:</span>
            <span>{isKeluar ? "PENJUALAN" : "RESTOCK"}</span>
          </div>
          {transaksi.keterangan && (
            <div className="pt-0.5 text-[9px] italic text-slate-700">
              Ket: {transaksi.keterangan}
            </div>
          )}
        </div>

        <div className="border-b border-dashed border-black my-1" />

        {/* Daftar Barang */}
        <div className="space-y-1">
          {transaksi.items.map((item, index) => (
            <div key={item.id || index} className="text-[10px]">
              <div className="font-bold truncate">{item.nama_barang}</div>
              <div className="flex justify-between text-[9.5px]">
                <span>
                  {item.qty} x {formatRupiah(item.harga_satuan).replace("Rp ", "")}
                  {item.jenis_harga ? ` (${item.jenis_harga.charAt(0)})` : ""}
                </span>
                <span className="font-bold">{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-black my-1" />

        {/* Total & Pembayaran */}
        <div className="space-y-0.5 text-[10.5px]">
          <div className="flex justify-between font-bold text-[11px]">
            <span>TOTAL:</span>
            <span>{formatRupiah(transaksi.grand_total)}</span>
          </div>
          {isKeluar && (
            <>
              <div className="flex justify-between text-[10px]">
                <span>BAYAR:</span>
                <span>{formatRupiah(transaksi.nominal_bayar)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold">
                <span>KEMBALI:</span>
                <span>{formatRupiah(transaksi.kembalian)}</span>
              </div>
            </>
          )}
        </div>

        <div className="border-b border-dashed border-black my-1" />

        {/* Footer Apotek */}
        <div className="text-center text-[9px] pt-1 space-y-0.5">
          <p>{pengaturan.footer_struk}</p>
          <p className="text-[8px] italic">Barang dibeli tdk dpt ditukar</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. TAMPILAN FORMAT THERMAL 80mm (DEFAULT STANDARD)
  // ==========================================
  return (
    <div
      className={`struk-item ${
        isBatch ? "struk-page-break" : ""
      } bg-white text-black p-4 font-mono text-xs leading-normal w-[310px] mx-auto shadow-md print:shadow-none print:w-[80mm] print:p-2 print:m-0`}
    >
      {/* Header Apotek */}
      <div className="text-center pb-2">
        <h3 className="font-bold uppercase text-sm tracking-wide">
          {pengaturan.nama_toko}
        </h3>
        <p className="text-[11px] text-slate-700 leading-tight mt-0.5">
          {pengaturan.alamat}
        </p>
        <p className="text-[11px] text-slate-700">Telp: {pengaturan.telepon}</p>
      </div>

      <div className="border-b-2 border-dashed border-black my-2" />

      {/* Info Transaksi */}
      <div className="text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>No. Transaksi</span>
          <span className="font-bold">{transaksi.no_transaksi}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu</span>
          <span>{formatTanggalWaktu(transaksi.tanggal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir / Petugas</span>
          <span>{transaksi.user?.nama || "Kasir"}</span>
        </div>
        <div className="flex justify-between">
          <span>Jenis Transaksi</span>
          <span className="font-semibold">
            {isKeluar ? "PENJUALAN POS" : "RESTOCK INVENTORI"}
          </span>
        </div>
        {transaksi.keterangan && (
          <div className="text-[10px] text-slate-700 pt-0.5">
            <span>Catatan:</span> {transaksi.keterangan}
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-black my-2" />

      {/* Daftar Item Barang */}
      <div className="space-y-1.5">
        {transaksi.items.map((item, index) => (
          <div key={item.id || index} className="text-xs">
            <div className="font-bold flex justify-between">
              <span className="truncate pr-1">{item.nama_barang}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-800">
              <span>
                {item.qty} x {formatRupiah(item.harga_satuan)}
                {item.jenis_harga && (
                  <span className="text-[10px] ml-1 px-1 bg-slate-100 rounded border border-slate-300">
                    {item.jenis_harga}
                  </span>
                )}
              </span>
              <span className="font-bold font-mono">{formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b-2 border-dashed border-black my-2" />

      {/* Ringkasan Total & Pembayaran */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between font-bold text-sm">
          <span>TOTAL BELANJA:</span>
          <span className="font-mono">{formatRupiah(transaksi.grand_total)}</span>
        </div>
        {isKeluar && (
          <>
            <div className="flex justify-between text-slate-800">
              <span>TUNAI / BAYAR:</span>
              <span className="font-mono">{formatRupiah(transaksi.nominal_bayar)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-dotted border-black pt-1">
              <span>KEMBALIAN:</span>
              <span className="font-mono">{formatRupiah(transaksi.kembalian)}</span>
            </div>
          </>
        )}
      </div>

      <div className="border-b border-dashed border-black my-2" />

      {/* Footer Toko */}
      <div className="text-center text-[10.5px] pt-1 space-y-1">
        <p className="font-medium">{pengaturan.footer_struk}</p>
        <p className="text-[9.5px] italic text-slate-700">
          Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.
        </p>
      </div>
    </div>
  );
}
