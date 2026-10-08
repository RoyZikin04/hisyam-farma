"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowDownToLine,
  Receipt,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  Store,
} from "lucide-react";

interface UserProfile {
  id: string;
  nama: string;
  username: string;
  role: "ADMIN" | "KASIR";
}

export default function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Gagal logout:", err);
    }
  };

  const adminMenu = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Master Barang", href: "/barang", icon: Package },
    { name: "Barang Masuk", href: "/transaksi/masuk", icon: ArrowDownToLine },
    { name: "Kasir (POS)", href: "/transaksi/kasir", icon: ShoppingCart },
    { name: "Daftar Struk", href: "/struk", icon: Receipt },
    { name: "Import & Export", href: "/import-export", icon: FileSpreadsheet },
    { name: "Kelola Pengguna", href: "/pengguna", icon: Users },
    { name: "Pengaturan Toko", href: "/pengaturan", icon: Settings },
  ];

  const kasirMenu = [
    { name: "Kasir (POS)", href: "/transaksi/kasir", icon: ShoppingCart },
    { name: "Daftar Struk Saya", href: "/struk", icon: Receipt },
  ];

  const menuItems = user.role === "ADMIN" ? adminMenu : kasirMenu;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 no-print select-none">
      {/* Brand & Logo */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl shadow-md text-white">
          <Store className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-sm tracking-tight text-white">APOTEK BERKAH</h2>
          <p className="text-xs text-emerald-400 font-medium">Sistem POS & Stok</p>
        </div>
      </div>

      {/* Profil Singkat Pengguna */}
      <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">{user.nama}</p>
          <p className="text-xs text-slate-400 truncate">@{user.username}</p>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            user.role === "ADMIN"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          }`}
        >
          {user.role}
        </span>
      </div>

      {/* Menu Navigasi */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Navigasi Utama
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Tombol Keluar (Logout) */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-all cursor-pointer border border-rose-500/20"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sesi</span>
        </button>
      </div>
    </aside>
  );
}
