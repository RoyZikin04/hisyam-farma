import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const rateLimitKey = `${ip}:${username.toLowerCase()}`;

    // 1. Cek Rate Limiting (Maksimal 5x gagal per 5 menit)
    const rateCheck = checkRateLimit(rateLimitKey, 5, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan gagal. Akun diblokir sementara. Coba lagi dalam ${rateCheck.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    // 2. Cari pengguna di database
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: `Username atau password salah. (Sisa percobaan: ${rateCheck.remaining})`,
        },
        { status: 401 }
      );
    }

    // 3. Cek status keaktifan akun
    if (!user.aktif) {
      return NextResponse.json(
        { error: "Akun Anda telah dinonaktifkan. Silakan hubungi Administrator." },
        { status: 403 }
      );
    }

    // 4. Verifikasi password bcrypt
    const passwordMatch = await verifyPassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        {
          error: `Username atau password salah. (Sisa percobaan: ${rateCheck.remaining})`,
        },
        { status: 401 }
      );
    }

    // 5. Berhasil login: reset rate limit & buat token sesi
    resetRateLimit(rateLimitKey);

    const token = await signAuthToken({
      userId: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role as "ADMIN" | "KASIR",
    });

    const redirectUrl = user.role === "ADMIN" ? "/" : "/transaksi/kasir";

    const response = NextResponse.json({
      success: true,
      message: `Selamat datang, ${user.nama}!`,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        role: user.role,
      },
      redirectUrl,
    });

    // Set cookie sesi aman httpOnly
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 jam
    });

    return response;
  } catch (error) {
    console.error("Error pada proses login:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat memproses login." },
      { status: 500 }
    );
  }
}
