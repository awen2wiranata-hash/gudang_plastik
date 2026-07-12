import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// Fungsi pembantu membaca cookie pelaku (Versi Async Next.js terbaru)
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
// 1. CREATE: Tambah Barang Baru
// ==========================================
export async function POST(request: Request) {
  try {
    const { kodeBarang, namaBarang, kategori } = await request.json();
    const barangBaru = await prisma.barang.create({
      data: { kodeBarang, namaBarang, kategori },
    });
    return NextResponse.json(barangBaru, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Gagal menambah data:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Terjadi kesalahan yang tidak diketahui" }, { status: 500 });
  }
}
// ==========================================
// 2. READ: Ambil Data Barang (Dengan Filter Dinamis)
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";
    const filter = activeOnly ? { isAktif: true } : {};

    const semuaBarang = await prisma.barang.findMany({
      where: filter,
      include: {
        _count: { select: { riwayatMasuk: true, riwayatKeluar: true } }
      },
      orderBy: [{ isAktif: 'desc' }, { createdAt: 'desc' }]
    });
    return NextResponse.json(semuaBarang, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Gagal mengambil data:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}


export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, isToggleStatus, isAktif, kodeBarang, namaBarang, kategori } = body;
    
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Cari data barang sebelum diubah untuk arsip lama
      const barangLama = await tx.barang.findUnique({ where: { id } });
      if (!barangLama) throw new Error("Barang tidak ditemukan di database!");

      const snapshotLama = JSON.stringify({
        barang: [{ nama: barangLama.namaBarang, qty: barangLama.stokSekarang, aktif: barangLama.isAktif }]
      });

      // PERCABANGAN LOGIKA A: JIKA HANYA INGIN MENGUBAH STATUS AKTIF / NONAKTIF
      if (isToggleStatus) {
        const barangUpdateStatus = await tx.barang.update({
          where: { id: id },
          data: { isAktif },
        });

        const snapshotBaru = JSON.stringify({
          barang: [{ nama: barangUpdateStatus.namaBarang, qty: barangUpdateStatus.stokSekarang, aktif: barangUpdateStatus.isAktif }]
        });

        // REKAM JEJAK PERUBAHAN STATUS KE AUDIT LOG
        await tx.auditLog.create({
          data: {
            username: actor.username,
            role: actor.role,
            aksi: "TOGGLE_STATUS_MASTER_BARANG",
            nomorNota: barangLama.kodeBarang,
            dataLama: snapshotLama,
            dataBaru: snapshotBaru
          }
        });

        return barangUpdateStatus;
      }

      // PERCABANGAN LOGIKA B: EDIT DATA MASTER BARANG BIASA
      const barangUpdateBiasa = await tx.barang.update({
        where: { id: id },
        data: { kodeBarang, namaBarang, kategori },
      });

      const snapshotBaruBiasa = JSON.stringify({
        barang: [{ nama: barangUpdateBiasa.namaBarang, qty: barangUpdateBiasa.stokSekarang, aktif: barangUpdateBiasa.isAktif }]
      });

      // REKAM JEJAK EDIT MASTER KE AUDIT LOG
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_MASTER_BARANG",
          nomorNota: barangLama.kodeBarang,
          dataLama: snapshotLama,
          dataBaru: snapshotBaruBiasa
        }
      });

      return barangUpdateBiasa;
    });

    return NextResponse.json(hasil, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Data Barang (Strict Check) & REKAM AUDIT LOG
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    // 1. AMBIL JUMLAH DEPENDENSI TRANSAKSI BARANG TERLEBIH DAHULU
    const cekBarang = await prisma.barang.findUnique({
      where: { id },
      include: {
        _count: {
          select: { riwayatMasuk: true, riwayatKeluar: true }
        }
      }
    });

    if (!cekBarang) return NextResponse.json({ error: "Barang tidak ditemukan!" }, { status: 404 });

    const sudahAdaTransaksi = cekBarang._count.riwayatMasuk > 0 || cekBarang._count.riwayatKeluar > 0;

    // PROTEKSI: Tolak kueri hapus fisik jika sudah berelasi dengan tabel nota manapun
    if (sudahAdaTransaksi) {
      return NextResponse.json({ 
        error: "Barang ini tidak bisa dihapus secara permanen karena telah memiliki riwayat transaksi masuk/keluar! Silakan gunakan fitur 'Nonaktifkan' untuk mengarsipkannya." 
      }, { status: 400 });
    }

    const actor = await getUserFromCookie();

    await prisma.$transaction(async (tx) => {
      // 2. Ambil snapshot data barang sebelum dihapus permanen
      const barangLama = await tx.barang.findUnique({ where: { id } });
      if (!barangLama) throw new Error("Barang tidak ditemukan!");

      const snapshotLama = JSON.stringify({
        barang: [{ nama: barangLama.namaBarang, qty: barangLama.stokSekarang }]
      });

      // 3. Hapus barang secara fisik (Hard Delete aman dilakukan karena relasi bernilai 0)
      await tx.barang.delete({
        where: { id: id }
      });

      // 4. 🔥 REKAM JEJAK PENGHAPUSAN MASTER KE AUDIT LOG
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "DELETE_MASTER_BARANG",
          nomorNota: barangLama.kodeBarang,
          dataLama: snapshotLama,
          dataBaru: JSON.stringify({ pesan: `Barang [${barangLama.namaBarang}] telah dihapus dari sistem.` })
        }
      });
    });

    return NextResponse.json({ message: "Berhasil dihapus & log direkam" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}