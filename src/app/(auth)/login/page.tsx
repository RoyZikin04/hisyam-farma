"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Store, Lock, User, AlertCircle, ArrowRight, ShieldCheck, ShoppingCart } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg("Mohon lengkapi username dan password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Gagal masuk ke sistem.");
        setLoading(false);
        return;
      }

      // Berhasil masuk, arahkan ke rute tujuan
      if (data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        router.push(redirectParam);
      }
      router.refresh();
    } catch {
      setErrorMsg("Terjadi gangguan koneksi ke server. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const isiAkunDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header Kartu */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-8 text-white text-center relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="inline-flex p-3 bg-white/15 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
              <Store className="w-9 h-9 text-emerald-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sistem Penjualan & Stok</h1>
            <p className="text-emerald-100 text-sm mt-1">Apotek & Toko Sehat Berkah</p>
          </div>

          {/* Form Login */}
          <div className="p-8">
            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Nama Pengguna (Username)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Tombol Cepat Demo Akun */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 text-center uppercase tracking-wider mb-3">
                Akun Demo Cepat (1-Klik)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => isiAkunDemo("admin", "admin123")}
                  className="p-2.5 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent rounded-xl text-xs font-medium text-slate-700 hover:text-emerald-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Admin Toko</span>
                </button>
                <button
                  type="button"
                  onClick={() => isiAkunDemo("kasir", "kasir123")}
                  className="p-2.5 bg-slate-100 hover:bg-teal-50 hover:border-teal-200 border border-transparent rounded-xl text-xs font-medium text-slate-700 hover:text-teal-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 text-teal-600" />
                  <span>Kasir POS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Sistem Penjualan & Stok Barang &copy; 2026. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
}
