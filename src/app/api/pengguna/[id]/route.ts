import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter").optional(),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore")
    .optional(),
  password: z.string().min(6, "Password baru minimal 6 karakter").optional().or(z.literal("")),
  role: z.enum(["ADMIN", "KASIR"]).optional(),
  aktif: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cegah admin menonaktifkan akunnya sendiri
    if (adminUser.id === id && parsed.data.aktif === false) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan akun administrator Anda sendiri." },
        { status: 400 }
      );
    }

    // Cegah admin menurunkan role-nya sendiri
    if (adminUser.id === id && parsed.data.role && parsed.data.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Anda tidak dapat mengubah peran akun administrator Anda sendiri." },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (parsed.data.nama) updateData.nama = parsed.data.nama;
    if (parsed.data.role) updateData.role = parsed.data.role;
    if (typeof parsed.data.aktif === "boolean") updateData.aktif = parsed.data.aktif;

    // Cek duplikasi jika username diubah
    if (parsed.data.username && parsed.data.username.toLowerCase() !== existing.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: parsed.data.username.toLowerCase() },
      });
      if (usernameExists) {
        return NextResponse.json(
          { error: `Username "${parsed.data.username}" sudah digunakan akun lain.` },
          { status: 400 }
        );
      }
      updateData.username = parsed.data.username.toLowerCase();
    }

    // Jika password diisi, hash password baru
    if (parsed.data.password && parsed.data.password.length >= 6) {
      updateData.password = await hashPassword(parsed.data.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Data pengguna "${updated.nama}" berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memperbarui pengguna." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin();
    const { id } = await params;

    // Cegah admin menghapus dirinya sendiri
    if (adminUser.id === id) {
      return NextResponse.json(
        { error: "Anda tidak dapat menonaktifkan/menghapus akun Anda sendiri." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // Soft delete / nonaktifkan pengguna
    const updated = await prisma.user.update({
      where: { id },
      data: { aktif: false },
      select: {
        id: true,
        nama: true,
        username: true,
        aktif: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Akun pengguna "${updated.nama}" berhasil dinonaktifkan.`,
      data: updated,
    });
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menonaktifkan pengguna." }, { status: 500 });
  }
}
