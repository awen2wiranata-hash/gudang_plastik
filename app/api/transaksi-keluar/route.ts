import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { nomorNota, customerId, detailBarang } = await request.json();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Catat Nota Keluar
      const nota = await tx.transaksiKeluar.create({
        data: {
          nomorNota,
          customerId,
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah)
            }))
          }
        }
      });

      // 2. POTONG STOK (Decrement)
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        
        // Validasi: Jangan sampai stok minus
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
    
  // PERBAIKAN DI SINI: Mengganti any menjadi unknown
  } catch (error: unknown) {
    // Kita cek dulu apakah ini benar-benar objek Error bawaan sistem
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Jika bentuk error-nya aneh/tidak diketahui
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