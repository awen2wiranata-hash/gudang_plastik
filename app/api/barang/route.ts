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
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah data" }, { status: 500 });
  }
}

// ==========================================
// 2. READ: Ambil Semua Data Barang
// ==========================================
export async function GET() {
  try {
    const semuaBarang = await prisma.barang.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(semuaBarang, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// ==========================================
// 3. UPDATE: Edit Data Barang & REKAM AUDIT LOG
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, kodeBarang, namaBarang, kategori } = await request.json();
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    const hasil = await prisma.$transaction(async (tx) => {
      // 1. Cari data barang sebelum diubah untuk arsip lama
      const barangLama = await tx.barang.findUnique({ where: { id } });
      if (!barangLama) throw new Error("Barang tidak ditemukan di database!");

      const snapshotLama = JSON.stringify({
        barang: [{ nama: barangLama.namaBarang, qty: barangLama.stokSekarang }]
      });

      // 2. Update data barangnya
      const barangUpdate = await tx.barang.update({
        where: { id: id },
        data: { kodeBarang, namaBarang, kategori },
      });

      const snapshotBaru = JSON.stringify({
        barang: [{ nama: barangUpdate.namaBarang, qty: barangUpdate.stokSekarang }]
      });

      // 3. 🔥 REKAM JEJAK EDIT MASTER KE AUDIT LOG
      // @ts-ignore
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_MASTER_BARANG",
          nomorNota: barangLama.kodeBarang, // Memanfaatkan kolom nota untuk menyimpan Kode Barang
          dataLama: snapshotLama,
          dataBaru: snapshotBaru
        }
      });

      return barangUpdate;
    });

    return NextResponse.json(hasil, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: Hapus Data Barang & REKAM AUDIT LOG
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    await prisma.$transaction(async (tx) => {
      // 1. Ambil snapshot data barang sebelum dihapus permanen
      const barangLama = await tx.barang.findUnique({ where: { id } });
      if (!barangLama) throw new Error("Barang tidak ditemukan!");

      const snapshotLama = JSON.stringify({
        barang: [{ nama: barangLama.namaBarang, qty: barangLama.stokSekarang }]
      });

      // 2. Hapus barang
      await tx.barang.delete({
        where: { id: id }
      });

      // 3. 🔥 REKAM JEJAK PENGHAPUSAN MASTER KE AUDIT LOG
      // @ts-ignore
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