import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Memanggil model auditLog langsung dari instance global
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        tanggal: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error("Error Fetching Audit Logs:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data riwayat log forensik." },
      { status: 500 }
    );
  }
}