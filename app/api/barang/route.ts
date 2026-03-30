import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Memanggil kunci kontak yang kita buat di Langkah 1

// 1. Fungsi GET: Untuk menampilkan daftar barang
export async function GET() {
  try {
    // Prisma tolong carikan semua data di tabel Barang, urutkan dari yang terbaru
    const semuaBarang = await prisma.barang.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Kembalikan datanya dalam bentuk JSON
    return NextResponse.json(semuBarang, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data barang" }, { status: 500 });
  }
}

// 2. Fungsi POST: Untuk menambah barang baru
export async function POST(request: Request) {
  try {
    // Tangkap data yang dikirim oleh user dari form frontend nanti
    const body = await request.json();
    const { kodeBarang, namaBarang, kategori, leadTime } = body;

    // Prisma tolong buatkan 1 baris data baru di tabel Barang
    const barangBaru = await prisma.barang.create({
      data: {
        kodeBarang: kodeBarang,
        namaBarang: namaBarang,
        kategori: kategori,
        leadTime: Number(leadTime), 
        stokSekarang: 0 // Stok awal selalu 0, akan bertambah jika ada Barang Masuk
      }
    });

    return NextResponse.json(barangBaru, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah data barang baru" }, { status: 500 });
  }
}