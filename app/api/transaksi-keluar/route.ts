import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers"; // Untuk melacak siapa aktor pelakunya

// 🛠️ FIX 1: Menggunakan async karena cookies() di Next.js versi baru harus di-await
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
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Transaksi Baru (Kurangi Stok + Auto Urutan Bulanan / Custom Nota)
// ==========================================
export async function POST(request: Request) {
  try {
    const { nomorNota, customerId, detailBarang, tanggal } = await request.json();

    // Inisialisasi tanggal transaksi (jika kosong gunakan waktu sekarang)
    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();
    let nomorNotaFinal = nomorNota ? nomorNota.trim() : "";

    const hasil = await prisma.$transaction(async (tx) => {
      
      // --- LOGIKA AUTO GENERATE NOTA BERDASARKAN URUTAN BULANAN JIKA KOSONG ---
      if (!nomorNotaFinal) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth(); // 0 = Januari, 11 = Desember

        // Tentukan batas awal dan batas akhir bulan berjalan
        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        // Hitung total transaksi keluar yang sudah ada pada bulan tersebut
        const jumlahTransaksiBulanIni = await tx.transaksiKeluar.count({
          where: {
            tanggal: {
              gte: awalBulan,
              lte: akhirBulan,
            },
          },
        });

        // Format bulan dan tahun untuk komponen string nota
        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        
        // Urutan nota baru = jumlah transaksi yang ada + 1 (di-pad 4 digit, misal: 0001)
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        // Satukan menjadi kode nota: OUT-202606-0001
        nomorNotaFinal = `OUT-${strTahun}${strBulan}-${urutanNota}`;
      }
      // -------------------------------------------------------------------------

      // Cek apakah nomor nota kustom/otomatis sudah terpakai (Mencegah Crash karena @unique)
      const cekNota = await tx.transaksiKeluar.findUnique({
        where: { nomorNota: nomorNotaFinal }
      });
      if (cekNota) {
        throw new Error(`Nomor nota [${nomorNotaFinal}] sudah terdaftar di database! Gunakan nomor lain.`);
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
// 3. PUT: Edit Transaksi (Rollback & Catat Audit Log)
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, nomorNota, customerId, detailBarang, tanggal } = await request.json();
    
    if (!id) throw new Error("ID Transaksi tidak ditemukan saat mengedit!");

    const actor = await getUserFromCookie();
    const tanggalTransaksi = tanggal ? new Date(tanggal) : new Date();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Cari transaksi lama
      const txLama = await tx.transaksiKeluar.findUnique({
        where: { id }, 
        include: { detailBarang: { include: { barang: true } } }
      });
      if (!txLama) throw new Error("Data transaksi lama tidak ditemukan di database!");

      const snapshotDataLama = JSON.stringify({
        nomorNota: txLama.nomorNota,
        tanggal: txLama.tanggal,
        barang: txLama.detailBarang.map(d => ({ nama: d.barang.namaBarang, qty: d.jumlah }))
      });

      // 2. Rollback stok lama
      for (const item of txLama.detailBarang) {
        await tx.barang.update({
          where: { id: item.barangId },
          data: { stokSekarang: { increment: item.jumlah } }
        });
      }

      // Logika otomatisasi nomor nota jika saat edit kolom sengaja dikosongkan
      let nomorNotaFinal = nomorNota ? nomorNota.trim() : "";
      if (!nomorNotaFinal) {
        const tahun = tanggalTransaksi.getFullYear();
        const bulan = tanggalTransaksi.getMonth();
        const awalBulan = new Date(tahun, bulan, 1);
        const akhirBulan = new Date(tahun, bulan + 1, 0, 23, 59, 59, 999);

        const jumlahTransaksiBulanIni = await tx.transaksiKeluar.count({
          where: {
            tanggal: { gte: awalBulan, lte: akhirBulan },
            id: { not: id } // Abaikan nota ini sendiri agar nomor urutan tidak melompat
          },
        });

        const strBulan = String(bulan + 1).padStart(2, '0');
        const strTahun = String(tahun);
        const urutanNota = String(jumlahTransaksiBulanIni + 1).padStart(4, '0');

        nomorNotaFinal = `OUT-${strTahun}${strBulan}-${urutanNota}`;
      }

      // 3. Update Detail Baru
      const txUpdate = await tx.transaksiKeluar.update({
        where: { id },
        data: {
          nomorNota: nomorNotaFinal, 
          customerId, 
          tanggal: tanggalTransaksi,
          detailBarang: {
            deleteMany: {}, 
            create: detailBarang.map((item: { barangId: string; jumlah: number }) => ({
              barangId: item.barangId, jumlah: Number(item.jumlah), tanggalKeluar: tanggalTransaksi
            }))
          }
        },
        include: { detailBarang: { include: { barang: true } } }
      });

      // 4. Kurangi stok baru
      for (const item of detailBarang) {
        const barang = await tx.barang.findUnique({ where: { id: item.barangId } });
        const jumlahDiminta = Number(item.jumlah);
        
        if (!barang) throw new Error("Ada barang yang tidak dikenali!");
        
        if (barang.stokSekarang < jumlahDiminta) {
          throw new Error(`Stok [${barang.namaBarang}] tidak cukup! Sisa stok hanya ${barang.stokSekarang}.`);
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

      // 🔥 REKAM JEJAK EDIT KE AUDIT LOG
      // @ts-ignore
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

        // 🔥 REKAM JEJAK HAPUS KE AUDIT LOG
        // @ts-ignore
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
    });

    return NextResponse.json({ message: "Dihapus & Stok dikembalikan serta log direkam!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}