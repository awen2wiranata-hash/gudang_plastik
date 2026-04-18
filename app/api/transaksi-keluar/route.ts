import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { nomorNota, customerId, detailBarang, tanggal } = await request.json();

    const hasil = await prisma.$transaction(async (tx) => {
      const nota = await tx.transaksiKeluar.create({
        data: {
          nomorNota,
          customerId,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah),
              tanggalKeluar: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        
        if (!barang || barang.stokSekarang < item.jumlah) {
          throw new Error(`Stok untuk ${barang?.namaBarang || 'barang'} tidak mencukupi!`);
        }

        await tx.barang.update({
          where: { id: item.barangId },
          data: {
            stokSekarang: { decrement: Number(item.jumlah) }
          }
        });
      }
      return nota;
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan sistem yang tidak diketahui" }, { status: 500 });
  }
}

export async function GET() {
  const data = await prisma.transaksiKeluar.findMany({
    include: { customer: true, detailBarang: { include: { barang: true } } },
    orderBy: { tanggal: 'desc' }
  });
  return NextResponse.json(data);
}