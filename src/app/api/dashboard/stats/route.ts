import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDashboardStats, DashboardFilter } from "@/services/dashboard";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const periode = (searchParams.get("periode") as any) || "7hari";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter: DashboardFilter = {
      periode,
      startDate,
      endDate,
    };

    const stats = await getDashboardStats(filter);
    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message?.startsWith("FORBIDDEN")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Gagal mengambil statistik dashboard:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data statistik dashboard." },
      { status: 500 }
    );
  }
}
