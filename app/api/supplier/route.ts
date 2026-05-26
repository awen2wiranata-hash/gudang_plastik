import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getUserFromCookie() {
  const cookieStore = await cookies(); 
  const token = cookieStore.get("token")?.value;
  if (!token) return { username: "System_Unknown", role: "UNKNOWN" };
  
  const parts = decodeURIComponent(token).split("|");
  return { username: parts[0] || "Unknown_User", role: parts[1] || "ADMIN" };
}

// ==========================================
// READ: Ambil Semua Data Supplier
// ==========================================
export async function GET() {
  try {
    const data = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// ==========================================
// CREATE: Tambah Supplier Baru & REKAM LOG
// ==========================================
export async function POST(request: Request) {
  try {
    const { namaPabrik, kontak, alamat } = await request.json();
    const actor = await getUserFromCookie();

    const baru = await prisma.$transaction(async (tx) => {
      const supplierBaru = await tx.supplier.create({ data: { namaPabrik, kontak, alamat } });

      // @ts-ignore
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "CREATE_MASTER_SUPPLIER",
          nomorNota: "-",
          dataLama: JSON.stringify({ pesan: "Data pabrik baru belum terdaftar." }),
          dataBaru: JSON.stringify({ barang: [{ nama: supplierBaru.namaPabrik, qty: 1 }] })
        }
      });

      return supplierBaru;
    });

    return NextResponse.json(baru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}

// ==========================================
// UPDATE: Edit Data Supplier & REKAM LOG
// ==========================================
export async function PUT(request: Request) {
  try {
    const { id, namaPabrik, kontak, alamat } = await request.json();
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    const updateData = await prisma.$transaction(async (tx) => {
      const lama = await tx.supplier.findUnique({ where: { id } });
      if (!lama) throw new Error("Supplier tidak ditemukan!");

      const supplierUpdate = await tx.supplier.update({
        where: { id },
        data: { namaPabrik, kontak, alamat }
      });

      // @ts-ignore
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_MASTER_SUPPLIER",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: lama.namaPabrik, qty: 1 }] }),
          dataBaru: JSON.stringify({ barang: [{ nama: supplierUpdate.namaPabrik, qty: 1 }] })
        }
      });

      return supplierUpdate;
    });

    return NextResponse.json(updateData, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengupdate data" }, { status: 500 });
  }
}

// ==========================================
// DELETE: Hapus Data Supplier & REKAM LOG
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    await prisma.$transaction(async (tx) => {
      const lama = await tx.supplier.findUnique({ where: { id } });
      if (!lama) throw new Error("Supplier tidak ditemukan!");

      await tx.supplier.delete({ where: { id } });

      // @ts-ignore
      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "DELETE_MASTER_SUPPLIER",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: lama.namaPabrik, qty: 1 }] }),
          dataBaru: JSON.stringify({ pesan: `Supplier [${lama.namaPabrik}] dihapus permanen.` })
        }
      });
    });

    return NextResponse.json({ message: "Berhasil dihapus & log direkam" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menghapus data" }, { status: 500 });
  }
}