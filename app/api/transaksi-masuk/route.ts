import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Mengambil riwayat
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
    return NextResponse.json({ error: "Gagal mengambil riwayat" }, { status: 500 });
  }
}

// POST: Tambah Transaksi Baru
export async function POST(request: Request) {
  try {
    const { nomorNota, supplierId, detailBarang, tanggal } = await request.json();

    const hasil = await prisma.$transaction(async (tx) => {
      const notaBaru = await tx.transaksiMasuk.create({
        data: {
          nomorNota,
          supplierId,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            // PERBAIKAN DI SINI: Mengganti any dengan tipe yang jelas
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah),
              tanggalMasuk: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      // Tambah Stok
      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: Number(item.jumlah) } }
        });
      }
      return notaBaru;
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 });
  }
}

// PUT: Edit Transaksi (Rollback stok lama -> Terapkan stok baru)
export async function PUT(request: Request) {
  try {
    const { id, nomorNota, supplierId, detailBarang, tanggal } = await request.json();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Cari transaksi lama
      const txLama = await tx.transaksiMasuk.findUnique({
        where: { id },
        include: { detailBarang: true }
      });

      if (!txLama) throw new Error("Transaksi tidak ditemukan");

      // 2. Rollback (kurangi) stok lama
      for (const item of txLama.detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: item.jumlah } }
        });
      }

      // 3. Update Nota dan Ganti Detail Barang
      const txUpdate = await tx.transaksiMasuk.update({
        where: { id },
        data: {
          nomorNota,
          supplierId,
          tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            deleteMany: {}, // Hapus detail lama
            // PERBAIKAN DI SINI: Mengganti any dengan tipe yang jelas
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId,
              jumlah: Number(item.jumlah),
              tanggalMasuk: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      // 4. Terapkan (tambah) stok baru
      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: Number(item.jumlah) } }
        });
      }

      return txUpdate;
    });

    return NextResponse.json(hasil, { status: 200 });
    
  // PERBAIKAN DI SINI: Mengganti any menjadi unknown
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

// DELETE: Hapus Transaksi (Rollback stok otomatis)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID tidak ada" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      const txLama = await tx.transaksiMasuk.findUnique({
        where: { id },
        include: { detailBarang: true }
      });

      if (txLama) {
        // Rollback stok
        for (const item of txLama.detailBarang) {
          await tx.barang.update({
            where: { id: item.barangId },
            data: { stokSekarang: { decrement: item.jumlah } }
          });
        }
        // Hapus detail lalu hapus nota
        await tx.transaksiMasuk.update({
          where: { id },
          data: { detailBarang: { deleteMany: {} } }
        });
        await tx.transaksiMasuk.delete({ where: { id } });
      }
    });

    return NextResponse.json({ message: "Dihapus & Stok dikembalikan" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}