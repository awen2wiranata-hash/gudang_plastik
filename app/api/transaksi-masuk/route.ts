import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Fungsi pembantu untuk membaca cookie pelakunya (Sudah versi Async Next.js terbaru)
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
// 1. GET: Ambil Semua Riwayat Transaksi Masuk (Multi-level Sorting)
// ==========================================
export async function GET() {
  try {
    const data = await prisma.transaksiMasuk.findMany({
      include: { supplier: true, detailBarang: { include: { barang: true } } },
      orderBy: [
        { tanggal: 'desc' }, // Kriteria 1: Urutkan berdasarkan tanggal nota terbaru
        { id: 'desc' }       // Kriteria 2: Jika tanggal sama, urutkan berdasarkan inputan paling baru (ID terbesar)
      ]
    });
    return NextResponse.json(data);
  } catch {
    // Memperbaiki: Menghapus variabel error yang tidak digunakan
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Transaksi Masuk Baru (Tambah Stok + Otomatisasi Nomor Nota)
// ==========================================
export async function POST(request: Request) {
  try {
    const { nomorNota, supplierId, detailBarang, tanggal } = await request.json();

    // Inisialisasi tanggal transaksi (jika kosong gunakan waktu sekarang)
    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();

    const hasil = await prisma.$transaction(async (tx) => {
      let finalNomorNota = nomorNota?.trim();

      // LOGIKA OTOMATISASI NOTA JIKA DIKOSONGKAN
      if (!finalNomorNota) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth(); // 0 = Januari, 11 = Desember

        // Tentukan batas awal dan batas akhir bulan berjalan
        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        // Hitung total transaksi masuk yang sudah ada pada bulan tersebut
        const jumlahTransaksiBulanIni = await tx.transaksiMasuk.count({
          where: {
            tanggal: {
              gte: awalBulan,
              lte: akhirBulan,
            },
          },
        });

        // Format tanggal untuk komponen string nota: DDMMYYYY
        const strHari = String(tanggalTransaksi.getDate()).padStart(2, '0');
        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        
        // Urutan nota baru = jumlah transaksi yang ada + 1 (di-pad 4 digit, misal: 0001)
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        // Satukan menjadi kode nota: DDMMYYYY-0001
        finalNomorNota = `${strHari}${strBulan}${strTahun}-${urutanNota}`;
      }

      // Buat nota masuk baru di database
      const nota = await tx.transaksiMasuk.create({
        data: {
          nomorNota: finalNomorNota, 
          supplierId, 
          tanggal: tanggalTransaksi,
          detailBarang: {
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, 
              jumlah: Number(item.jumlah), 
              tanggalMasuk: tanggalTransaksi
            }))
          }
        }
      });

      // Tambah Stok Barang ke Gudang
      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { 
            stokSekarang: { increment: Number(item.jumlah) } 
          }
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
// 3. PUT: Edit Transaksi Masuk (Rollback, Tambah Ulang & REKAM AUDIT LOG)
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, nomorNota, supplierId, detailBarang, tanggal } = await request.json();
    if (!id) throw new Error("ID Transaksi tidak ditemukan!");

    const actor = await getUserFromCookie();
    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Ambil snapshot data lama untuk forensik
      const txLama = await tx.transaksiMasuk.findUnique({
        where: { id }, 
        include: { detailBarang: { include: { barang: true } } }
      });
      if (!txLama) throw new Error("Data transaksi lama tidak ditemukan!");

      const snapshotDataLama = JSON.stringify({
        nomorNota: txLama.nomorNota,
        tanggal: txLama.tanggal,
        barang: txLama.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
      });

      // 2. Rollback (Kurangi stok lama dari gudang karena nota mau diedit)
      for (const item of txLama.detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { decrement: item.jumlah } }
        });
      }

      // Logika otomatisasi nota jika saat edit kolom dikosongkan
      let finalNomorNota = nomorNota?.trim();
      if (!finalNomorNota) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth();
        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        const jumlahTransaksiBulanIni = await tx.transaksiMasuk.count({
          where: {
            tanggal: { gte: awalBulan, lte: akhirBulan },
            id: { not: id } // Abaikan nota ini sendiri agar urutan tidak melompat
          },
        });

        const strHari = String(tanggalTransaksi.getDate()).padStart(2, '0');
        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        finalNomorNota = `${strHari}${strBulan}${strTahun}-${urutanNota}`;
      }

      // 3. Update Nota dan Detail Baru
      const txUpdate = await tx.transaksiMasuk.update({
        where: { id },
        data: {
          nomorNota: finalNomorNota, 
          supplierId, 
          tanggal: tanggalTransaksi,
          detailBarang: {
            deleteMany: {}, 
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, jumlah: Number(item.jumlah), tanggalMasuk: tanggalTransaksi
            }))
          }
        },
        include: { detailBarang: { include: { barang: true } } }
      });

      // 4. Tambahkan stok baru ke gudang
      for (const item of detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: Number(item.jumlah) } }
        });
      }

      const snapshotDataBaru = JSON.stringify({
        nomorNota: txUpdate.nomorNota,
        tanggal: txUpdate.tanggal,
        barang: txUpdate.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
      });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_PASOKAN_MASUK",
          nomorNota: txLama.nomorNota,
          dataLama: snapshotDataLama,
          dataBaru: snapshotDataBaru
        }
      });
      
      return txUpdate;
    });

    return NextResponse.json(hasil, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Transaksi Masuk (Potong Stok & REKAM AUDIT LOG)
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    await prisma.$transaction(async (tx) => {
      const txLama = await tx.transaksiMasuk.findUnique({
        where: { id }, 
        include: { detailBarang: { include: { barang: true } } }
      });

      if (txLama) {
        const snapshotDataLama = JSON.stringify({
          nomorNota: txLama.nomorNota,
          tanggal: txLama.tanggal,
          barang: txLama.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
        });

        // Potong kembali stok gudang karena notanya dibatalkan/dihapus
        for (const item of txLama.detailBarang) {
          await tx.barang.update({
            where: { id: item.barangId },
            data: { stokSekarang: { decrement: item.jumlah } }
          });
        }

        // Hapus data transaksi fisik
        await tx.transaksiMasuk.update({
          where: { id }, data: { detailBarang: { deleteMany: {} } }
        });
        await tx.transaksiMasuk.delete({ where: { id } });

        await tx.auditLog.create({
          data: {
            username: actor.username,
            role: actor.role,
            aksi: "DELETE_PASOKAN_MASUK",
            nomorNota: txLama.nomorNota,
            dataLama: snapshotDataLama,
            dataBaru: JSON.stringify({ pesan: "Nota pasokan masuk dihapus permanen, stok gudang dipotong otomatis." })
          }
        });
      }
    });

    return NextResponse.json({ message: "Data masuk dihapus & log direkam!" }, { status: 200 });
  } catch {
    // Memperbaiki: Menghapus variabel error yang tidak digunakan
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}