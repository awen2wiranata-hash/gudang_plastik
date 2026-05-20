import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    
    // 1. TENTUKAN TITIK AWAL HARI SENIN MINGGU INI (Jam 00:00:00)
    const dayOfWeek = now.getDay();
    // Di JavaScript: Minggu = 0, Senin = 1. Kita ubah agar Senin = 0, Minggu = 6
    const daysSinceMonday = (dayOfWeek + 6) % 7; 
    
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysSinceMonday);
    currentMonday.setHours(0, 0, 0, 0); // Kunci di jam 12 malam pas

    const msPerDay = 24 * 60 * 60 * 1000;
    
    // 2. BUAT KERANJANG WAKTU (Mundur per 7 hari dari Senin minggu ini)
    const batasW4 = currentMonday.getTime();                 // W4: Senin minggu ini
    const batasW3 = batasW4 - (7 * msPerDay);                // W3: Senin 1 minggu lalu
    const batasW2 = batasW4 - (14 * msPerDay);               // W2: Senin 2 minggu lalu
    const batasW1 = batasW4 - (21 * msPerDay);               // W1: Senin 3 minggu lalu (Contoh: 30 Maret)
    const batasW0 = batasW4 - (28 * msPerDay);               // W0: Senin 4 minggu lalu (Khusus untuk hitung MAPE)

    // Tarik data 4 minggu full ke belakang
    const semuaBarang = await prisma.barang.findMany({
      include: {
        riwayatKeluar: {
          where: { tanggalKeluar: { gte: new Date(batasW0) } }
        }
      },
      orderBy: { namaBarang: 'asc' }
    });

    const hasilLaporan = semuaBarang.map(barang => {
      let w0 = 0, w1 = 0, w2 = 0, w3 = 0, w4 = 0;
      
      // Kelompokkan penjualan ke minggu yang tepat (Senin - Minggu)
      barang.riwayatKeluar.forEach(keluar => {
        const tglTrans = new Date(keluar.tanggalKeluar).getTime();
        if (tglTrans >= batasW0 && tglTrans < batasW1) w0 += keluar.jumlah;
        else if (tglTrans >= batasW1 && tglTrans < batasW2) w1 += keluar.jumlah;
        else if (tglTrans >= batasW2 && tglTrans < batasW3) w2 += keluar.jumlah;
        else if (tglTrans >= batasW3 && tglTrans < batasW4) w3 += keluar.jumlah; // Minggu lalu
        else if (tglTrans >= batasW4) w4 += keluar.jumlah; // Minggu ini (Sedang berjalan)
      });

      // --- LOGIKA PERAMALAN (SMA) ---
      // Ramal minggu ini (W4) menggunakan 3 minggu full sebelumnya (W1, W2, W3)
      const smaMingguIni = (w1 + w2 + w3) / 3;

      // --- LOGIKA HITUNG MAPE (AKURASI ERROR) ---
      // Karena minggu ini (W4) belum selesai (baru hari Kamis), tidak adil menghitung error di W4.
      // Kita hitung MAPE dari minggu lalu (W3) yang sudah selesai dari Senin-Minggu.
      // Prediksi W3 didapat dari rata-rata (W0 + W1 + W2).
      const prediksiMingguLalu = (w0 + w1 + w2) / 3;
      let mape = 0;
      
      if (w3 > 0) {
        mape = Math.abs((w3 - prediksiMingguLalu) / w3) * 100;
      } else if (w3 === 0 && prediksiMingguLalu > 0) {
        mape = 100; 
      }

// --- LOGIKA HITUNG SMA MINGGU DEPAN ---
      const smaMingguDepan = (w2 + w3 + w4) / 3;

      // ==========================================
      // --- LOGIKA HITUNG ROP ---
      // ==========================================
      // 1. Tentukan Lead Time (Asumsi terburuk 7 hari karena antisipasi weekend)
      const leadTimeHari = 7;
      
      // 2. Cari penjualan rata-rata harian
      const penjualanHarian = smaMingguDepan / 7;
      
      // 3. Hitung Safety Stock Dinamis (20% dari peramalan minggu depan)
      const safetyStock = Math.ceil(smaMingguDepan * 0.20);
      
      // 4. Rumus ROP
      const nilaiRop = Math.ceil((leadTimeHari * penjualanHarian) + safetyStock);
      
      // 5. Penentu Status (Bandingkan Stok Fisik dengan ROP)
      const statusPeringatan = barang.stokSekarang <= nilaiRop ? "PERLU RESTOCK ⚠️" : "AMAN ✅";
      // ==========================================

   return {
        id: barang.id,
        kodeBarang: barang.kodeBarang,
        namaBarang: barang.namaBarang,
        stokSekarang: barang.stokSekarang,
        tanggalAwal: new Date(batasW1).toISOString(),
        tanggalAkhir: new Date(batasW4 - 1).toISOString(), 
        total3Minggu: w1 + w2 + w3, 
        
        // FIX 1: Panggil variabel smaMingguDepan yang tepat
        smaMingguDepan: parseFloat(smaMingguDepan.toFixed(2)),
        
        mape: parseFloat(mape.toFixed(2)),
        
        // FIX 2: Sisipkan variabel ROP agar datanya bisa ditarik oleh tabel halaman UI
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