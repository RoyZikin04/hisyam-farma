"use client";

import { useState, useEffect } from "react";
import { UserCheck, Menu } from "lucide-react";

interface UserProfile {
  id: string;
  nama: string;
  username: string;
  role: "ADMIN" | "KASIR";
}

interface NavbarProps {
  user: UserProfile;
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ user, onToggleMobileMenu }: NavbarProps) {
  const [waktu, setWaktu] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWaktu(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between no-print flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        {/* Tombol Hamburger di Layar Mobile */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl md:hidden transition-colors cursor-pointer"
          title="Buka Navigasi Menu"
          aria-label="Buka Navigasi Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
        <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
          {waktu || "Memuat waktu..."}
        </span>
        <span className="text-xs font-bold text-slate-800 tracking-tight sm:hidden">
          APOTEK BERKAH
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
          <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="max-w-[100px] sm:max-w-none truncate">{user.nama}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-semibold">{user.role}</span>
        </div>
      </div>
    </header>
  );
}
