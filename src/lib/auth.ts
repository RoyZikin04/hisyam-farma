import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "kunci-rahasia-sistem-penjualan-dan-stok-barang-2026"
);

export const AUTH_COOKIE_NAME = "sesi_pengguna";

export interface TokenPayload {
  userId: string;
  username: string;
  nama: string;
  role: "ADMIN" | "KASIR";
}

/**
 * Hash password menggunakan bcrypt
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

/**
 * Bandingkan password plain dengan hash
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Buat JWT session token
 */
export async function signAuthToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

/**
 * Verifikasi JWT session token
 */
export async function verifyAuthToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Mengambil session user dari cookie dan memverifikasi ke database
 * untuk memastikan user masih ada, role valid, dan status aktif === true.
 * Memenuhi syarat: Cek role dan status aktif user di setiap route handler/server action.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyAuthToken(token);
    if (!payload?.userId) return null;

    // Verifikasi status terkini di database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
      },
    });

    if (!user || !user.aktif) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Gagal mendapatkan session user:", error);
    return null;
  }
}

/**
 * Guard untuk Route Handler / Server Action: wajib login dan aktif
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Sesi Anda telah berakhir atau akun dinonaktifkan.");
  }
  return user;
}

/**
 * Guard untuk Route Handler / Server Action: wajib role ADMIN dan aktif
 */
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN: Akses khusus Admin.");
  }
  return user;
}

/**
 * Guard untuk Route Handler / Server Action: boleh KASIR atau ADMIN dan aktif
 */
export async function requireKasirOrAdmin() {
  const user = await requireAuth();
  if (user.role !== "KASIR" && user.role !== "ADMIN") {
    throw new Error("FORBIDDEN: Akses tidak diizinkan.");
  }
  return user;
}
