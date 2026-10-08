import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Package, Users, ShoppingCart, ShieldCheck } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Jika Kasir, arahkan ke halaman transaksi kasir
  if (user.role === "KASIR") {
    redirect("/transaksi/kasir");
  }

  // Ambil ringkasan cepat data untuk Milestone (a)
  const [totalBarang, totalPengguna, pengaturan] = await Promise.all([
    prisma.penjualan.count({ where: { aktif: true } }),
    prisma.user.count({ where: { aktif: true } }),
    prisma.pengaturan.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Banner Selamat Datang */}
      <div className="p-6 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Panel Administrator
          </span>
          <h1 className="text-2xl font-bold">Halo, {user.nama}!</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Selamat datang di panel kendali {pengaturan?.nama_toko || "Apotek & Toko Berkah"}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-white/10 rounded-xl text-xs font-medium border border-white/20 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Hak Akses Penuh (ADMIN)</span>
          </span>
        </div>
      </div>

      {/* Kartu Ringkasan Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Master Barang Aktif
            </p>
            <h3 className="text-2xl font-bold text-slate-800">{totalBarang} Barang</h3>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pengguna Terdaftar
            </p>
            <h3 className="text-2xl font-bold text-slate-800">{totalPengguna} Akun</h3>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Status Sistem POS
            </p>
            <h3 className="text-2xl font-bold text-emerald-600">Aktif & Siap</h3>
          </div>
        </div>
      </div>

      {/* Ringkasan Konfigurasi Toko */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-base font-bold text-slate-800 mb-4">Informasi Toko & Konfigurasi Sistem</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Nama Toko:</span>
              <span className="font-semibold text-slate-800">{pengaturan?.nama_toko}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Alamat:</span>
              <span className="font-semibold text-slate-800">{pengaturan?.alamat}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Telepon:</span>
              <span className="font-semibold text-slate-800">{pengaturan?.telepon}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Markup Bebas / Resep / Grosir:</span>
              <span className="font-semibold text-slate-800">
                {pengaturan?.default_markup_bebas}% / {pengaturan?.default_markup_resep}% / {pengaturan?.default_markup_grosir}%
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Langkah Pembulatan:</span>
              <span className="font-semibold text-slate-800">Rp {pengaturan?.pembulatan}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Ukuran Kertas Struk:</span>
              <span className="font-semibold text-emerald-600 font-mono">{pengaturan?.ukuran_kertas}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
