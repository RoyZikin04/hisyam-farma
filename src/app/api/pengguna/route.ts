import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createUserSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  username: z.string().min(3, "Username minimal 3 karakter").regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  role: z.enum(["ADMIN", "KASIR"]),
  aktif: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat daftar pengguna." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input pengguna tidak valid" },
        { status: 400 }
      );
    }

    const { nama, username, password, role, aktif } = parsed.data;

    // Cek username unik
    const existing = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Username "${username}" sudah digunakan.` },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        nama,
        username: username.toLowerCase(),
        password: hashedPassword,
        role,
        aktif,
      },
      select: {
        id: true,
        nama: true,
        username: true,
        role: true,
        aktif: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Pengguna "${newUser.nama}" (@${newUser.username}) berhasil ditambahkan.`,
        data: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menambahkan pengguna baru." }, { status: 500 });
  }
}
