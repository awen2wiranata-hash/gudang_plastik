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
    
    // 2. REVISI KERANJANG WAKTU (Mundur murni dari Senin minggu ini)
    // W4 adalah MINGGU LALU (Full 7 Hari yang sudah selesai)
    const batasAkhir = currentMonday.getTime();              // Batas tutup buku (Senin minggu ini, jam 00:00)
    const batasW4 = batasAkhir - (7 * msPerDay);             // W4: Mulai Senin minggu lalu (Contoh: 25 Mei)
    const batasW3 = batasAkhir - (14 * msPerDay);            // W3: Mulai 2 Senin lalu (Contoh: 18 Mei)
    const batasW2 = batasAkhir - (21 * msPerDay);            // W2: Mulai 3 Senin lalu (Contoh: 11 Mei)
    const batasW1 = batasAkhir - (28 * msPerDay);            // W1: Mulai 4 Senin lalu (Contoh: 4 Mei)

    // Tarik data 4 minggu penuh ke belakang (Tidak termasuk minggu yang sedang berjalan saat ini)
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
      let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      
      // Kelompokkan penjualan ke minggu yang tepat
      barang.riwayatKeluar.forEach(keluar => {
        const tglTrans = new Date(keluar.tanggalKeluar).getTime();
        if (tglTrans >= batasW1 && tglTrans < batasW2) w1 += keluar.jumlah;
        else if (tglTrans >= batasW2 && tglTrans < batasW3) w2 += keluar.jumlah;
        else if (tglTrans >= batasW3 && tglTrans < batasW4) w3 += keluar.jumlah;
        else if (tglTrans >= batasW4 && tglTrans < batasAkhir) w4 += keluar.jumlah; // W4 = Minggu Lalu
      });

      // --- 1. LOGIKA PERAMALAN (SMA) MINGGU DEPAN ---
      // Ramal menggunakan 3 minggu terakhir yang sudah FULL (W2, W3, W4)
      const total3MingguTerakhir = w2 + w3 + w4;
      const smaMingguDepan = total3MingguTerakhir / 3;

      // --- 2. LOGIKA HITUNG MAPE (AKURASI ERROR) ---
      // Bandingkan prediksi W4 (Rata-rata W1, W2, W3) dengan Penjualan asli W4
      const prediksiW4 = (w1 + w2 + w3) / 3;
      let mape = 0;
      
      if (w4 > 0) {
        mape = Math.abs((w4 - prediksiW4) / w4) * 100;
      } else if (w4 === 0 && prediksiW4 > 0) {
        mape = 100; 
      }

      // --- 3. LOGIKA HITUNG ROP ---
      const leadTimeHari = 7;
      const penjualanHarian = smaMingguDepan / 7;
      const safetyStock = Math.ceil(smaMingguDepan * 0.20);
      const nilaiRop = Math.ceil((leadTimeHari * penjualanHarian) + safetyStock);
      
      // Penentu Status (Bandingkan Stok Fisik dengan ROP)
      const statusPeringatan = barang.stokSekarang <= nilaiRop ? "PERLU RESTOCK ⚠️" : "AMAN ✅";

      return {
        id: barang.id,
        kodeBarang: barang.kodeBarang,
        namaBarang: barang.namaBarang,
        stokSekarang: barang.stokSekarang,
        tanggalAwal: new Date(batasW2).toISOString(), // Info tabel: Dari W2...
        tanggalAkhir: new Date(batasAkhir - 1).toISOString(), // ...Sampai akhir W4
        total3Minggu: total3MingguTerakhir, 
        smaMingguDepan: parseFloat(smaMingguDepan.toFixed(2)),
        mape: parseFloat(mape.toFixed(2)),
        batasRop: nilaiRop,
        statusPeringatan: statusPeringatan 
      };
    });

    return NextResponse.json(hasilLaporan, { status: 200 });

  } catch (error) {
    console.error("Error GET Peramalan:", error);
    return NextResponse.json({ error: "Gagal memproses data peramalan" }, { status: 500 });
  }
}