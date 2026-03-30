import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const semuaBarang = await prisma.barang.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Perbaikan Typo: sekarang tulisannya sudah benar "semuaBarang"
    return NextResponse.json(semuaBarang, { status: 200 });
  } catch (error) {
    // Tambahan: agar kalau ada error lagi, terminal akan memberi tahu penyebab pastinya
    console.error("Error GET Barang:", error);
    return NextResponse.json({ error: "Gagal mengambil data barang" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kodeBarang, namaBarang, kategori, leadTime } = body;

    const barangBaru = await prisma.barang.create({
      data: {
        kodeBarang: kodeBarang,
        namaBarang: namaBarang,
        kategori: kategori,
        leadTime: Number(leadTime) || 1, 
        stokSekarang: 0
      }
    });

    return NextResponse.json(barangBaru, { status: 201 });
  } catch (error) {
    console.error("Error POST Barang:", error);
    return NextResponse.json({ error: "Gagal menambah data barang baru" }, { status: 500 });
  }
}