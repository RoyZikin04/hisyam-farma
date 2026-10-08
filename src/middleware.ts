import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "kunci-rahasia-sistem-penjualan-dan-stok-barang-2026"
);

const AUTH_COOKIE_NAME = "sesi_pengguna";

// Rute yang hanya boleh diakses oleh ADMIN
const ADMIN_ONLY_PATHS = [
  "/",
  "/barang",
  "/import-export",
  "/pengguna",
  "/pengaturan",
  "/transaksi/masuk",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Abaikan static files, asset publik, dan api login/logout
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // 1. Jika pengguna membuka halaman Login
  if (pathname === "/login") {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        const role = payload.role as string;
        if (role === "ADMIN") {
          return NextResponse.redirect(new URL("/", request.url));
        } else {
          return NextResponse.redirect(new URL("/transaksi/kasir", request.url));
        }
      } catch {
        // Token tidak valid, izinkan tetap di /login
        const response = NextResponse.next();
        response.cookies.delete(AUTH_COOKIE_NAME);
        return response;
      }
    }
    return NextResponse.next();
  }

  // 2. Jika membuka halaman atau API yang dilindungi tanpa token
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sesi Anda telah berakhir. Silakan login kembali." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Verifikasi token
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const role = payload.role as string;

    // 4. Batasan Role Kasir: Kasir HANYA boleh mengakses transaksi kasir, struk, dan cari barang
    if (role === "KASIR") {
      // Jika kasir mencoba mengakses halaman admin khusus
      const isAdminPage =
        pathname === "/" ||
        pathname.startsWith("/barang") ||
        pathname.startsWith("/import-export") ||
        pathname.startsWith("/pengguna") ||
        pathname.startsWith("/pengaturan") ||
        pathname.startsWith("/transaksi/masuk");

      if (isAdminPage) {
        return NextResponse.redirect(new URL("/transaksi/kasir", request.url));
      }

      // Jika kasir mencoba akses endpoint API admin
      const isAdminApi =
        (pathname.startsWith("/api/pengguna")) ||
        (pathname.startsWith("/api/pengaturan")) ||
        (pathname.startsWith("/api/barang/import")) ||
        (pathname.startsWith("/api/barang/export"));

      if (isAdminApi) {
        return NextResponse.json(
          { error: "Akses ditolak: Hanya Admin yang dapat melakukan aksi ini." },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  } catch {
    // Token kedaluwarsa atau palsu
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login kembali." },
        { status: 401 }
      );
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
