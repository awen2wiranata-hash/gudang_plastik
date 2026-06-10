import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    
    // 1. TENTUKAN HARI SENIN MINGGU INI (Sebagai Batas Akhir Penarikan Data)
    const dayOfWeek = now.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7; 
    
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysSinceMonday);
    currentMonday.setHours(0, 0, 0, 0); 

    const msPerDay = 24 * 60 * 60 * 1000;
    
    // 2. PERLUAS TIMELINE MENJADI 6 MINGGU PENUH (Mundur murni dari Senin minggu ini)
    const batasAkhir = currentMonday.getTime();              // Batas tutup buku (Senin minggu ini, jam 00:00)
    const batasW6 = batasAkhir - (7 * msPerDay);             // W6: Mulai Senin minggu lalu (Minggu Terakhir)
    const batasW5 = batasAkhir - (14 * msPerDay);            // W5: Mulai 2 Senin lalu
    const batasW4 = batasAkhir - (21 * msPerDay);            // W4: Mulai 3 Senin lalu
    const batasW3 = batasAkhir - (28 * msPerDay);            // W3: Mulai 4 Senin lalu
    const batasW2 = batasAkhir - (35 * msPerDay);            // W2: Mulai 5 Senin lalu
    const batasW1 = batasAkhir - (42 * msPerDay);            // W1: Mulai 6 Senin lalu (Batas awal Penarikan)

    // Tarik data 6 minggu penuh ke belakang (Tidak termasuk minggu yang sedang berjalan saat ini)
    const semuaBarang = await prisma.barang.findMany({
      include: {
        riwayatKeluar: {
          where: { 
            tanggalKeluar: { 
              gte: new Date(batasW1),
              lt: new Date(batasAkhir) // Kunci: Hanya tarik data yang selesai SEBELUM minggu ini dimulai
            } 
          }
        }
      },
      orderBy: { namaBarang: 'asc' }
    });

    const hasilLaporan = semuaBarang.map(barang => {
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0, w6 = 0;
      
      // Kelompokkan penjualan ke dalam 6 slot minggu secara tepat
      barang.riwayatKeluar.forEach(keluar => {
        const tglTrans = new Date(keluar.tanggalKeluar).getTime();
        if (tglTrans >= batasW1 && tglTrans < batasW2) w1 += keluar.jumlah;
        else if (tglTrans >= batasW2 && tglTrans < batasW3) w2 += keluar.jumlah;
        else if (tglTrans >= batasW3 && tglTrans < batasW4) w3 += keluar.jumlah;
        else if (tglTrans >= batasW4 && tglTrans < batasW5) w4 += keluar.jumlah;
        else if (tglTrans >= batasW5 && tglTrans < batasW6) w5 += keluar.jumlah;
        else if (tglTrans >= batasW6 && tglTrans < batasAkhir) w6 += keluar.jumlah; // W6 = Minggu ke-6 (paling aktual)
      });

      // --- 1. LOGIKA PERAMALAN (SMA-5) MINGGU DEPAN ---
      // Ramal menggunakan 5 minggu terakhir yang sudah FULL (W2, W3, W4, W5, W6)
      const total5MingguTerakhir = w2 + w3 + w4 + w5 + w6;
      const smaMingguDepan = total5MingguTerakhir / 5;

      // --- 2. LOGIKA HITUNG MAPE (AKURASI ERROR DI MINGGU KE-6) ---
      // Bandingkan prediksi W6 (Rata-rata 5 minggu sebelumnya: W1 sampai W5) dengan Aktual W6
      const prediksiW6 = (w1 + w2 + w3 + w4 + w5) / 5;
      let mape = 0;
      
      if (w6 > 0) {
        mape = Math.abs((w6 - prediksiW6) / w6) * 100;
      } else if (w6 === 0 && prediksiW6 > 0) {
        mape = 100; // Jika tidak ada penjualan tetapi diramal ada, error dianggap 100%
      }

      // --- 3. LOGIKA HITUNG REORDER POINT (ROP) ---
      const leadTimeHari = 7;
      const penjualanHarian = smaMingguDepan / 7;
      const safetyStock = Math.ceil(smaMingguDepan * 0.20); // Pengaman stok sebesar 20%
      const nilaiRop = Math.ceil((leadTimeHari * penjualanHarian) + safetyStock);
      
      // Penentu Status (Bandingkan Stok Fisik Aktual dengan Batas ROP)
      const statusPeringatan = barang.stokSekarang <= nilaiRop ? "PERLU RESTOCK ⚠️" : "AMAN ✅";

      return {
        id: barang.id,
        kodeBarang: barang.kodeBarang,
        namaBarang: barang.namaBarang,
        stokSekarang: barang.stokSekarang,
        tanggalAwal: new Date(batasW2).toISOString(),         // Informasi dasar tabel dimulai dari awal rentang W2
        tanggalAkhir: new Date(batasAkhir - 1).toISOString(),  // Sampai batas akhir penutupan buku W6
        total3Minggu: total5MingguTerakhir,                    // Dipertahankan nama field-nya agar frontend tidak perlu bongkar kode, namun isinya sudah akumulasi 5 minggu
        smaMingguDepan: parseFloat(smaMingguDepan.toFixed(2)),
        mape: parseFloat(mape.toFixed(2)),
        batasRop: nilaiRop,
        statusPeringatan: statusPeringatan 
      };
    });

    return NextResponse.json(hasilLaporan, { status: 200 });

  } catch (error) {
    console.error("Error GET Peramalan SMA-5:", error);
    return NextResponse.json({ error: "Gagal memproses data peramalan" }, { status: 500 });
  }
}