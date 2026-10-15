"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

interface UserProfile {
  id: string;
  nama: string;
  username: string;
  role: "ADMIN" | "KASIR";
}

export default function DashboardShell({
  user,
  children,
}: {
  user: UserProfile;
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar Responsive (Drawer di mobile, Static di desktop) */}
      <Sidebar
        user={user}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          user={user}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70">
          {children}
        </main>
      </div>
    </div>
  );
}
