import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// 🛠️ Fungsi pembantu pencari aktor dari cookies
async function getUserFromCookie() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("token")?.value;
  if (!token) return { username: "System_Unknown", role: "UNKNOWN" };
  
  const parts = decodeURIComponent(token).split("|");
  return {
    username: parts[0] || "Unknown_User",
    role: parts[1] || "ADMIN"
  };
}

// ==========================================
// 1. GET: Ambil Semua Riwayat Keluar
// ==========================================
export async function GET() {
  try {
    const data = await prisma.transaksiKeluar.findMany({
      include: { customer: true, detailBarang: { include: { barang: true } } },
      orderBy: [
        { tanggal: 'desc' },
        { id: 'desc' }
      ]
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Gagal mengambil data transaksi keluar:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Transaksi Baru (Kurangi Stok + Auto Urutan Nota)
// ==========================================
export async function POST(request: Request) {
  try {
    const { nomorNota, customerId, detailBarang, tanggal } = await request.json();

    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();
    let nomorNotaFinal = nomorNota ? nomorNota.trim() : "";

    // 🛠️ Tambahkan konfigurasi timeout 30 detik di akhir fungsi transaksi
    const hasil = await prisma.$transaction(async (tx) => {
      
      if (!nomorNotaFinal) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth();

        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        const jumlahTransaksiBulanIni = await tx.transaksiKeluar.count({
          where: {
            tanggal: { gte: awalBulan, lte: akhirBulan },
          },
        });

        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        nomorNotaFinal = `OUT-${strTahun}${strBulan}-${urutanNota}`;
      }

      const cekNota = await tx.transaksiKeluar.findUnique({
        where: { nomorNota: nomorNotaFinal }
      });
      if (cekNota) {
        throw new Error(`Nomor nota [${nomorNotaFinal}] sudah terdaftar! Gunakan nomor lain.`);
      }

      const nota = await tx.transaksiKeluar.create({
        data: {
          nomorNota: nomorNotaFinal, 
          customerId, 
          tanggal: tanggalTransaksi,
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, 
              jumlah: Number(item.jumlah), 
              tanggalKeluar: tanggalTransaksi
            }))
          }
        }
      });

      // Validasi dan Kurangi Stok Barang
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        if (!barang || barang.stokSekarang < Number(item.jumlah)) {
          throw new Error(`Stok [${barang?.namaBarang || 'barang'}] tidak cukup!`);
        }
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: Number(item.jumlah) } }
        });
      }
      return nota;
    }, {
      timeout: 30000 // 🛠️ FIX: Mencegah error timeout 5000ms di Supabase Cloud
    });

    return NextResponse.json(hasil, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}

// ==========================================
// 3. PUT: Edit Transaksi (Rollback & Catat Audit Log)
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, nomorNota, customerId, detailBarang, tanggal } = await request.json();
    
    if (!id) throw new Error("ID Transaksi tidak ditemukan saat mengedit!");

    const actor = await getUserFromCookie();
    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();

    // 🛠️ Tambahkan konfigurasi timeout 30 detik di akhir fungsi transaksi
    const hasil = await prisma.$transaction(async (tx) => {
      const txLama = await tx.transaksiKeluar.findUnique({
        where: { id }, 
        include: { detailBarang: { include: { barang: true } } }
      });
      if (!txLama) throw new Error("Data transaksi lama tidak ditemukan!");

      const snapshotDataLama = JSON.stringify({
        nomorNota: txLama.nomorNota,
        tanggal: txLama.tanggal,
        barang: txLama.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
      });

      // 1. Rollback stok lama (Stok dikembalikan dulu)
      for (const item of txLama.detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: item.jumlah } }
        });
      }

      let nomorNotaFinal = nomorNota ? nomorNota.trim() : "";
      if (!nomorNotaFinal) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth();
        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        const jumlahTransaksiBulanIni = await tx.transaksiKeluar.count({
          where: {
            tanggal: { gte: awalBulan, lte: akhirBulan },
            id: { not: id } 
          },
        });

        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        nomorNotaFinal = `OUT-${strTahun}${strBulan}-${urutanNota}`;
      }

      // 2. Hapus detail lama dan ganti dengan detail baru
      const txUpdate = await tx.transaksiKeluar.update({
        where: { id },
        data: {
          nomorNota: nomorNotaFinal, 
          customerId, 
          tanggal: tanggalTransaksi,
          detailBarang: {
            deleteMany: {}, 
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, 
              jumlah: Number(item.jumlah), 
              tanggalKeluar: tanggalTransaksi
            }))
          }
        },
        include: { detailBarang: { include: { barang: true } } }
      });

      // 3. Kurangi stok baru berdasarkan input yang diedit
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        const jumlahDiminta = Number(item.jumlah);
        
        if (!barang) throw new Error("Ada barang yang tidak dikenali!");
        if (barang.stokSekarang < jumlahDiminta) {
          throw new Error(`Stok [${barang.namaBarang}] tidak cukup! Sisa stok terkini: ${barang.stokSekarang}.`);
        }
        
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: jumlahDiminta } }
        });
      }

      const snapshotDataBaru = JSON.stringify({
        nomorNota: txUpdate.nomorNota,
        tanggal: txUpdate.tanggal,
        barang: txUpdate.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
      });

      // 4. Catat riwayat perubahan ke Audit Log
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_PENJUALAN",
          nomorNota: txLama.nomorNota,
          dataLama: snapshotDataLama,
          dataBaru: snapshotDataBaru
        }
      });
      
      return txUpdate;
    }, {
      timeout: 30000 // 🛠️ FIX: Mencegah error timeout 5000ms di Supabase Cloud
    });

    return NextResponse.json(hasil, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Terjadi kesalahan sistem internal" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Transaksi & Catat Audit Log
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID tidak ada" }, { status: 400 });

    const actor = await getUserFromCookie();

    await prisma.$transaction(async (tx) => {
      const txLama = await tx.transaksiKeluar.findUnique({
        where: { id }, 
        include: { detailBarang: { include: { barang: true } } }
      });

      if (txLama) {
        const snapshotDataLama = JSON.stringify({
          nomorNota: txLama.nomorNota,
          tanggal: txLama.tanggal,
          barang: txLama.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
        });

        // Kembalikan stok yang sempat dikurangi sebelum datanya dihapus
        for (const item of txLama.detailBarang) {
          await tx.barang.update({
            where: { id: item.barangId },
            data: { stokSekarang: { increment: item.jumlah } }
          });
        }

        await tx.transaksiKeluar.update({
          where: { id }, data: { detailBarang: { deleteMany: {} } }
        });
        await tx.transaksiKeluar.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            username: actor.username,
            role: actor.role,
            aksi: "DELETE_PENJUALAN",
            nomorNota: txLama.nomorNota,
            dataLama: snapshotDataLama,
            dataBaru: JSON.stringify({ pesan: "Data dihancurkan secara permanen dari sistem database." })
          }
        });
      }
    }, {
      timeout: 30000 // 🛠️ FIX: Amankan proses hapus data besar dari timeout
    });

    return NextResponse.json({ message: "Dihapus & Stok dikembalikan serta log direkam!" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("Gagal menghapus transaksi:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal menghapus data transaksi" }, { status: 500 });
  }
}