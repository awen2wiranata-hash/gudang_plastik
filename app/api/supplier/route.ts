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

// 1. GET
export async function GET() {
  try {
    const data = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Gagal ambil data:", error);
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// 2. POST
export async function POST(request: Request) {
  try {
    const { namaPabrik, kontak, alamat } = await request.json();
    const actor = await getUserFromCookie();

    const baru = await prisma.$transaction(async (tx) => {
      const supplierBaru = await tx.supplier.create({ data: { namaPabrik, kontak, alamat } });
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
  } catch (error: unknown) {
    console.error("Gagal simpan data:", error);
    return NextResponse.json({ error: "Gagal simpan data" }, { status: 500 });
  }
}

// 3. PUT
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
  } catch (error: unknown) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// 4. DELETE
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
  } catch (error: unknown) {
    if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}