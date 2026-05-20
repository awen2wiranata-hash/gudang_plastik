import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. GET: Ambil Semua Riwayat Keluar
// ==========================================
export async function GET() {
  try {
    const data = await prisma.transaksiKeluar.findMany({
      include: { customer: true, detailBarang: { include: { barang: true } } },
      orderBy: { tanggal: 'desc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Transaksi Baru (Kurangi Stok)
// ==========================================
export async function POST(request: Request) {
  try {
    const { nomorNota, customerId, detailBarang, tanggal } = await request.json();

    const hasil = await prisma.$transaction(async (tx) => {
      const nota = await tx.transaksiKeluar.create({
        data: {
          nomorNota, customerId, tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, jumlah: Number(item.jumlah), tanggalKeluar: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      // Kurangi Stok
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        if (!barang || barang.stokSekarang < item.jumlah) {
          throw new Error(`Stok [${barang?.namaBarang || 'barang'}] tidak cukup!`);
        }
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: Number(item.jumlah) } }
        });
      }
      return nota;
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

// ==========================================
// 3. PUT: Edit Transaksi (Rollback & Kurangi Ulang)
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, nomorNota, customerId, detailBarang, tanggal } = await request.json();
    
    if (!id) throw new Error("ID Transaksi tidak ditemukan saat mengedit!");

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Cari transaksi lama
      const txLama = await tx.transaksiKeluar.findUnique({
        where: { id }, include: { detailBarang: true }
      });
      if (!txLama) throw new Error("Data transaksi lama tidak ditemukan di database!");

      // 2. Rollback (Kembalikan stok lama ke gudang)
      for (const item of txLama.detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: item.jumlah } }
        });
      }

      // 3. Update Nota dan Detail Barang Baru
      const txUpdate = await tx.transaksiKeluar.update({
        where: { id },
        data: {
          nomorNota, customerId, tanggal: tanggal ? new Date(tanggal) : new Date(),
          detailBarang: {
            deleteMany: {}, // Hapus detail lama
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, jumlah: Number(item.jumlah), tanggalKeluar: tanggal ? new Date(tanggal) : new Date()
            }))
          }
        }
      });

      // 4. Kurangi stok baru dengan keamanan ketat
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        const jumlahDiminta = Number(item.jumlah);
        
        if (!barang) throw new Error("Ada barang yang tidak dikenali!");
        
        // Cek apakah stok (setelah di-rollback) cukup untuk permintaan baru
        if (barang.stokSekarang < jumlahDiminta) {
          throw new Error(`Stok [${barang.namaBarang}] tidak cukup! Sisa stok hanya ${barang.stokSekarang}, Anda menginput ${jumlahDiminta}.`);
        }
        
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: jumlahDiminta } }
        });
      }
      
      return txUpdate;
    });

    return NextResponse.json(hasil, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan sistem internal" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Transaksi (Kembalikan Stok)
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID tidak ada" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      const txLama = await tx.transaksiKeluar.findUnique({
        where: { id }, include: { detailBarang: true }
      });

      if (txLama) {
        // Rollback stok (Kembalikan ke gudang)
        for (const item of txLama.detailBarang) {
          await tx.barang.update({
            where: { id: item.barangId },
            data: { stokSekarang: { increment: item.jumlah } }
          });
        }
        // Hapus
        await tx.transaksiKeluar.update({
          where: { id }, data: { detailBarang: { deleteMany: {} } }
        });
        await tx.transaksiKeluar.delete({ where: { id } });
      }
    });

    return NextResponse.json({ message: "Dihapus & Stok dikembalikan" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}