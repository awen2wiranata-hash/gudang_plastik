import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const riwayatMasuk = await prisma.transaksiMasuk.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        supplier: true,
        detailBarang: { include: { barang: true } }
      }
    });
    return NextResponse.json(riwayatMasuk, { status: 200 });
  } catch (error) {
    console.error("Error GET Transaksi Masuk:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat transaksi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomorNota, supplierId, detailBarang, tanggal } = body;

    const hasilTransaksi = await prisma.$transaction(async (tx) => {
      const notaBaru = await tx.transaksiMasuk.create({
        data: {
          nomorNota: nomorNota,
          supplierId: supplierId,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number | string }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah),
              tanggalMasuk: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: {
            stokSekarang: { increment: Number(item.jumlah) }
          }
        });
      }
      return notaBaru;
    });

    return NextResponse.json(hasilTransaksi, { status: 201 });
  } catch (error: unknown) {
    console.error("Error POST Transaksi Masuk:", error);
    return NextResponse.json({ error: "Gagal menyimpan transaksi masuk" }, { status: 500 });
  }
}