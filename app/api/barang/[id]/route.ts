import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RiwayatKeluarItem {
  tanggalKeluar: Date;
  jumlah: number;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const now = new Date();
    
    // 1. TENTUKAN HARI SENIN MINGGU INI (Sebagai Batas Akhir Penarikan Data)
    const dayOfWeek = now.getDay();
    const daysSinceMonday = (dayOfWeek + 6) % 7; 
    
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - daysSinceMonday);
    currentMonday.setHours(0, 0, 0, 0); 

    const msPerDay = 24 * 60 * 60 * 1000;
    
    // 2. PERLUAS TIMELINE MENJADI 6 MINGGU PENUH
    const batasAkhir = currentMonday.getTime();
    const batasW6 = batasAkhir - (7 * msPerDay);
    const batasW5 = batasAkhir - (14 * msPerDay);
    const batasW4 = batasAkhir - (21 * msPerDay);
    const batasW3 = batasAkhir - (28 * msPerDay);
    const batasW2 = batasAkhir - (35 * msPerDay);
    const batasW1 = batasAkhir - (42 * msPerDay);

    // 3. Ambil data barang dan riwayat keluarnya
    const barang = await prisma.barang.findUnique({
      where: { id },
      include: {
        riwayatKeluar: {
          where: { 
            tanggalKeluar: { 
              gte: new Date(batasW1),
              lt: new Date(batasAkhir) 
            } 
          },
          orderBy: { tanggalKeluar: 'asc' }
        }
      }
    });

    if (!barang) return NextResponse.json({ error: "Barang tidak ditemukan" }, { status: 404 });

    // 4. Kelompokkan penjualan ke dalam slot minggu
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0, w6 = 0;
    
    barang.riwayatKeluar.forEach((keluar: RiwayatKeluarItem) => {
      const tglTrans = new Date(keluar.tanggalKeluar).getTime();
      if (tglTrans >= batasW1 && tglTrans < batasW2) w1 += keluar.jumlah;
      else if (tglTrans >= batasW2 && tglTrans < batasW3) w2 += keluar.jumlah;
      else if (tglTrans >= batasW3 && tglTrans < batasW4) w3 += keluar.jumlah;
      else if (tglTrans >= batasW4 && tglTrans < batasW5) w4 += keluar.jumlah;
      else if (tglTrans >= batasW5 && tglTrans < batasW6) w5 += keluar.jumlah;
      else if (tglTrans >= batasW6 && tglTrans < batasAkhir) w6 += keluar.jumlah;
    });

    // 5. LOGIKA PERAMALAN (SMA-5)
    const total5MingguTerakhir = w2 + w3 + w4 + w5 + w6;
    const smaMingguDepan = total5MingguTerakhir / 5;

    // 6. LOGIKA HITUNG MAPE
    const prediksiW6 = (w1 + w2 + w3 + w4 + w5) / 5;
    let mape = 0;
    
    if (w6 > 0) {
      const errorMurni = Math.abs((w6 - prediksiW6) / w6) * 100;
      mape = errorMurni > 100 ? 100 : errorMurni;
    } else if (w6 === 0 && prediksiW6 > 0) {
      mape = 100; 
    } else {
      mape = 0;
    }

    // 7. LOGIKA HITUNG ROP
    const leadTimeHari = 7;
    const penjualanHarian = smaMingguDepan / 7;
    const safetyStock = Math.ceil(smaMingguDepan * 0.20); 
    const nilaiRop = Math.ceil((leadTimeHari * penjualanHarian) + safetyStock);
    
    const statusPeringatan = barang.stokSekarang <= nilaiRop ? "PERLU RESTOCK" : "AMAN";

    // 8. Susun data Chart untuk Frontend (Tampilkan W2 sampai W6)
    const chartData = [
      { name: '5 Mgg Lalu', terjual: w2 },
      { name: '4 Mgg Lalu', terjual: w3 },
      { name: '3 Mgg Lalu', terjual: w4 },
      { name: '2 Mgg Lalu', terjual: w5 },
      { name: 'Mgg Lalu', terjual: w6 },
    ];

    return NextResponse.json({
      ...barang,
      chartData,
      statistik: {
        stokFisik: barang.stokSekarang,
        sma: parseFloat(smaMingguDepan.toFixed(2)),
        mape: parseFloat(mape.toFixed(2)),
        rop: nilaiRop,
        statusPeringatan: statusPeringatan
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error Detail API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// 🛠️ PERBAIKAN: Mengganti 'any' dengan 'unknown' dan pengecekan tipe data yang aman (TypeScript Compliant)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json(); 
    const gambarUrl = body.gambarUrl;
    
    const updated = await prisma.barang.update({
      where: { id: id },
      data: { gambarUrl: gambarUrl }
    });
    
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error("❌ ERROR PATCH GAMBAR:", error);
    
    let errorMessage = "Gagal update gambar ke database Supabase";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}