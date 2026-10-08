import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sesi tidak ditemukan atau akun dinonaktifkan." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user,
  });
}
