import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Tarik semua barang beserta riwayat penjualannya selama 28 HARI (4 Minggu) terakhir
    const tanggalBatas = new Date();
    tanggalBatas.setDate(tanggalBatas.getDate() - 28);

    const semuaBarang = await prisma.barang.findMany({
      include: {
        riwayatKeluar: {
          where: {
            tanggalKeluar: { gte: tanggalBatas }
          }
        }
      },
      orderBy: { namaBarang: 'asc' }
    });

    const hariIni = new Date();
    const tglMulai = new Date();
    tglMulai.setDate(hariIni.getDate() - 21); // Batas 3 minggu untuk tampilan

    // 2. Lakukan perhitungan SMA dan MAPE untuk setiap barang
    const hasilLaporan = semuaBarang.map(barang => {
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      
      const now = new Date().getTime();
      const dayMs = 24 * 60 * 60 * 1000;

      // Kelompokkan penjualan ke dalam 4 keranjang minggu
      barang.riwayatKeluar.forEach(keluar => {
        const diffDays = Math.floor((now - new Date(keluar.tanggalKeluar).getTime()) / dayMs);
        if (diffDays >= 21 && diffDays < 28) w1 += keluar.jumlah;      // Minggu ke-1 (Paling lama)
        else if (diffDays >= 14 && diffDays < 21) w2 += keluar.jumlah; // Minggu ke-2
        else if (diffDays >= 7 && diffDays < 14) w3 += keluar.jumlah;  // Minggu ke-3
        else if (diffDays >= 0 && diffDays < 7) w4 += keluar.jumlah;   // Minggu ke-4 (Minggu ini)
      });

      // --- LOGIKA HITUNG MAPE ---
      // Ramal minggu ini menggunakan 3 minggu sebelumnya
      const prediksiMingguIni = (w1 + w2 + w3) / 3;
      
      let mape = 0;
      // Rumus MAPE = |(Aktual - Prediksi) / Aktual| * 100%
      if (w4 > 0) {
        mape = Math.abs((w4 - prediksiMingguIni) / w4) * 100;
      } else if (w4 === 0 && prediksiMingguIni > 0) {
        mape = 100; // Jika aktual 0 tapi diprediksi ada, anggap error 100%
      }

      // --- LOGIKA HITUNG SMA MINGGU DEPAN ---
      // Ramal minggu depan menggunakan 3 minggu terakhir (termasuk minggu ini)
      const smaMingguDepan = (w2 + w3 + w4) / 3;

      return {
        id: barang.id,
        kodeBarang: barang.kodeBarang,
        namaBarang: barang.namaBarang,
        stokSekarang: barang.stokSekarang,
        tanggalAwal: tglMulai.toISOString(),
        tanggalAkhir: hariIni.toISOString(),
        total3Minggu: w2 + w3 + w4, // Total yang terjual 3 mgg terakhir
        smaMingguDepan: parseFloat(smaMingguDepan.toFixed(2)),
        mape: parseFloat(mape.toFixed(2))
      };
    });

    return NextResponse.json(hasilLaporan, { status: 200 });

  } catch (error) {
    console.error("Error GET Peramalan:", error);
    return NextResponse.json({ error: "Gagal memproses data peramalan" }, { status: 500 });
  }
}