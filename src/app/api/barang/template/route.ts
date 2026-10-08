import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { buatTemplateExcel } from "@/lib/excel";

export async function GET() {
  try {
    await requireAuth();

    const buffer = await buatTemplateExcel();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template_import_barang.xlsx"',
      },
    });
  } catch (error: any) {
    if (error.message?.startsWith("UNAUTHORIZED")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Gagal membuat template Excel." },
      { status: 500 }
    );
  }
}
