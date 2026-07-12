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
    const data = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(data, { status: 200 });
  } catch (error: unknown) {
    console.error("Gagal ambil data:", error);
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}

// 2. POST
export async function POST(request: Request) {
  try {
    const { nama, kontak, alamat } = await request.json();
    const actor = await getUserFromCookie();

    const baru = await prisma.$transaction(async (tx) => {
      const customerBaru = await tx.customer.create({ data: { nama, kontak, alamat } });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "CREATE_MASTER_CUSTOMER",
          nomorNota: "-",
          dataLama: JSON.stringify({ pesan: "Data baru belum terdaftar sebelumnya." }),
          dataBaru: JSON.stringify({ barang: [{ nama: customerBaru.nama, qty: 1 }] })
        }
      });
      return customerBaru;
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
    const { id, nama, kontak, alamat } = await request.json();
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    const actor = await getUserFromCookie();

    const updateData = await prisma.$transaction(async (tx) => {
      const lama = await tx.customer.findUnique({ where: { id } });
      if (!lama) throw new Error("Customer tidak ditemukan!");

      const customerUpdate = await tx.customer.update({
        where: { id },
        data: { nama, kontak, alamat }
      });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "UPDATE_MASTER_CUSTOMER",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: lama.nama, qty: 1 }] }),
          dataBaru: JSON.stringify({ barang: [{ nama: customerUpdate.nama, qty: 1 }] })
        }
      });
      return customerUpdate;
    });

    return NextResponse.json(updateData, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("Gagal update data:", error.message);
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
      const lama = await tx.customer.findUnique({ where: { id } });
      if (!lama) throw new Error("Customer tidak ditemukan!");

      await tx.customer.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          username: actor.username,
          role: actor.role,
          aksi: "DELETE_MASTER_CUSTOMER",
          nomorNota: "-",
          dataLama: JSON.stringify({ barang: [{ nama: lama.nama, qty: 1 }] }),
          dataBaru: JSON.stringify({ pesan: `Customer [${lama.nama}] dihapus permanen dari sistem.` })
        }
      });
    });

    return NextResponse.json({ message: "Berhasil dihapus & log direkam" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("Gagal hapus data:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}