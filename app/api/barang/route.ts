import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// CREATE
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

// READ
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

// UPDATE (EDIT)
export async function PUT(request: Request) {
  try {
    const { id, kodeBarang, namaBarang, kategori } = await request.json();
    const barangUpdate = await prisma.barang.update({
      where: { id: id },
      data: { kodeBarang, namaBarang, kategori },
    });
    return NextResponse.json(barangUpdate, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// DELETE (HAPUS)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Mengambil ID dari URL
    
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await prisma.barang.delete({
      where: { id: id }
    });
    return NextResponse.json({ message: "Berhasil dihapus" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}