import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mengambil riwayat hasil peramalan
export async function GET() {
  try {
    const data = await prisma.peramalan.findMany({
      include: { barang: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data peramalan" }, { status: 500 });
  }
}

// Menghitung dan menyimpan hasil SMA
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { barangId, tanggalAwal, tanggalAkhir, periode1, periode2, periode3 } = body;

    // 1. Proses Perhitungan SMA 3 Periode
    const totalPenjualan = Number(periode1) + Number(periode2) + Number(periode3);
    const hitungSMA = totalPenjualan / 3;

    // 2. Simpan ke Database
    const hasilPeramalan = await prisma.peramalan.create({
      data: {
        barangId: barangId,
        tanggalAwal: new Date(tanggalAwal),
        tanggalAkhir: new Date(tanggalAkhir),
        nilaiSMA: parseFloat(hitungSMA.toFixed(2)), // Dibulatkan 2 angka di belakang koma
      }
    });

    return NextResponse.json(hasilPeramalan, { status: 201 });
  } catch (error: unknown) {
    console.error("Error POST Peramalan:", error);
    return NextResponse.json({ error: "Gagal menghitung dan menyimpan peramalan" }, { status: 500 });
  }
}