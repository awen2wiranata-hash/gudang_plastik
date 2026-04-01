import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fungsi GET: Untuk melihat riwayat barang masuk beserta nama pabrik dan daftar barangnya
export async function GET() {
  try {
    const riwayatMasuk = await prisma.transaksiMasuk.findMany({
      orderBy: { tanggal: 'desc' },
      include: {
        supplier: true, // Ambil juga data pabriknya
        detailBarang: {
          include: {
            barang: true // Ambil juga nama barang plastiknya
          }
        }
      }
    });
    return NextResponse.json(riwayatMasuk, { status: 200 });
  } catch (error) {
    console.error("Error GET Transaksi Masuk:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat transaksi" }, { status: 500 });
  }
}

// Fungsi POST: Menyimpan Nota dan Menambah Stok Otomatis
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomorNota, supplierId, detailBarang } = body;

    const hasilTransaksi = await prisma.$transaction(async (tx) => {
      
      const notaBaru = await tx.transaksiMasuk.create({
        data: {
          nomorNota: nomorNota,
          supplierId: supplierId,
          detailBarang: {
            // PERBAIKAN DI SINI: Kita ganti 'any' dengan bentuk data yang spesifik
            create: detailBarang.map((item: { barangId: string; jumlah: number | string }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah)
            }))
          }
        }
      });

      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: {
            stokSekarang: {
              increment: Number(item.jumlah)
            }
          }
        });
      }

      return notaBaru;
    });

    return NextResponse.json(hasilTransaksi, { status: 201 });
  } catch (error) {
    console.error("Error POST Transaksi Masuk:", error);
    return NextResponse.json({ error: "Gagal menyimpan transaksi masuk" }, { status: 500 });
  }
}