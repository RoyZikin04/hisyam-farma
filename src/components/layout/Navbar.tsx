"use client";

import { useState, useEffect } from "react";
import { UserCheck } from "lucide-react";

interface UserProfile {
  id: string;
  nama: string;
  username: string;
  role: "ADMIN" | "KASIR";
}

export default function Navbar({ user }: { user: UserProfile }) {
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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between no-print flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
          {waktu || "Memuat waktu..."}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>{user.nama}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-semibold">{user.role}</span>
        </div>
      </div>
    </header>
  );
}
