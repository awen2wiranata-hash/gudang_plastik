import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Pastikan path prisma-mu benar

export async function POST(req: Request) {
  try {
    const dataBarang = await req.json(); 
    
    let sukses = 0;
    let gagal = 0;
    const detailGagal: string[] = [];

    // Loop data satu per satu
    for (const item of dataBarang) {
      // Sesuaikan string di dalam kurung kurung kotak ini dengan NAMA HEADER KOLOM EXCEL kamu
      const kode = String(item["Kode Barang"] || "").trim();
      const nama = String(item["Nama Barang"] || "").trim();
      const kategori = String(item["Kategori"] || "").trim();
      const stok = parseInt(item["Stok Awal"] || "0");

      if (!kode || !nama) {
        gagal++;
        detailGagal.push(`Ada baris kosong atau tidak memiliki nama/kode.`);
        continue;
      }

      // Validasi: Cek apakah kodeBarang atau namaBarang sudah ada di Database
      const cekDuplikat = await prisma.barang.findFirst({
        where: {
          OR: [
            { kodeBarang: kode },
            { namaBarang: nama }
          ]
        }
      });

      if (cekDuplikat) {
        gagal++;
        detailGagal.push(`Barang "${nama}" / KODE [${kode}] sudah terdaftar (Dilewati).`);
        continue; 
      }

      // Jika lolos validasi, masukkan ke database
      await prisma.barang.create({
        data: {
          kodeBarang: kode,
          namaBarang: nama,
          kategori: kategori,
          stokSekarang: stok
        }
      });
      sukses++;
    }

    return NextResponse.json({ 
      message: "Proses import selesai", 
      sukses, 
      gagal, 
      detailGagal 
    }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal memproses file Excel" }, { status: 500 });
  }
}