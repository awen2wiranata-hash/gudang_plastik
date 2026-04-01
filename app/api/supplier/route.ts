import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fungsi GET: Mengambil daftar supplier
export async function GET() {
  try {
    const semuaSupplier = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(semuaSupplier, { status: 200 });
  } catch (error) {
    console.error("Error GET Supplier:", error);
    return NextResponse.json({ error: "Gagal mengambil data supplier" }, { status: 500 });
  }
}

// Fungsi POST: Menambah supplier baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Sesuaikan dengan nama kolom di schema.prisma
    const { namaPabrik, kontak, alamat } = body;

    const supplierBaru = await prisma.supplier.create({
      data: {
        namaPabrik, // <-- Menggunakan namaPabrik
        kontak,
        alamat,
      }
    });

    return NextResponse.json(supplierBaru, { status: 201 });
  } catch (error) {
    console.error("Error POST Supplier:", error);
    return NextResponse.json({ error: "Gagal menambah data supplier" }, { status: 500 });
  }
}