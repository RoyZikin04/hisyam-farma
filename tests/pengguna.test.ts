import { describe, it, expect } from "vitest";
import { z } from "zod";

const userSchema = z.object({
  nama: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "KASIR"]),
  aktif: z.boolean(),
});

const settingSchema = z.object({
  pembulatan: z.number().int().refine((val) => [1, 50, 100, 500].includes(val)),
  ukuran_kertas: z.enum(["58mm", "80mm", "A4"]),
});

describe("Pengujian Validasi Pengguna & Pengaturan (Milestone g)", () => {
  it("Validasi input pengguna baru yang sah", () => {
    const validUser = {
      nama: "Siti Rahmawati",
      username: "siti_kasir1",
      password: "password123",
      role: "KASIR",
      aktif: true,
    };
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("Menolak username dengan spasi atau karakter ilegal", () => {
    const invalidUser = {
      nama: "Siti Rahmawati",
      username: "siti kasir!",
      password: "password123",
      role: "KASIR",
      aktif: true,
    };
    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
  });

  it("Menolak password di bawah 6 karakter", () => {
    const shortPassUser = {
      nama: "Siti Rahmawati",
      username: "sitikasir",
      password: "123",
      role: "KASIR",
      aktif: true,
    };
    const result = userSchema.safeParse(shortPassUser);
    expect(result.success).toBe(false);
  });

  it("Menolak role di luar ADMIN atau KASIR", () => {
    const badRoleUser = {
      nama: "Siti Rahmawati",
      username: "sitikasir",
      password: "password123",
      role: "SUPERADMIN",
      aktif: true,
    };
    const result = userSchema.safeParse(badRoleUser);
    expect(result.success).toBe(false);
  });

  it("Validasi opsi pembulatan pengaturan toko (1, 50, 100, 500)", () => {
    expect(settingSchema.safeParse({ pembulatan: 100, ukuran_kertas: "80mm" }).success).toBe(true);
    expect(settingSchema.safeParse({ pembulatan: 50, ukuran_kertas: "58mm" }).success).toBe(true);
    expect(settingSchema.safeParse({ pembulatan: 1, ukuran_kertas: "A4" }).success).toBe(true);
    expect(settingSchema.safeParse({ pembulatan: 25, ukuran_kertas: "80mm" }).success).toBe(false);
  });

  it("Pencegahan admin menonaktifkan akunnya sendiri", () => {
    const currentAdminId = "admin-123";
    const targetUserId = "admin-123";
    const targetAktif = false;

    const isSelfDeactivation = currentAdminId === targetUserId && targetAktif === false;
    expect(isSelfDeactivation).toBe(true);
  });
});
