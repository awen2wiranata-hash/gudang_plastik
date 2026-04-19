"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Clock, ChevronRight } from "lucide-react";

type Barang = { id: string; namaBarang: string; stokSekarang: number };
type Riwayat = { id: string; nomorNota: string; tanggal: string; tipe: "MASUK" | "KELUAR" };

export default function BerandaPage() {
  const [totalBarang, setTotalBarang] = useState(0);
  const [stokMenipis, setStokMenipis] = useState(0);
  const [aktivitas, setAktivitas] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Ambil data dari API yang sudah kita buat sebelumnya
        const [resBarang, resMasuk, resKeluar] = await Promise.all([
          fetch("/api/barang"),
          fetch("/api/transaksi-masuk"),
          fetch("/api/transaksi-keluar")
        ]);

        const dataBarang = await resBarang.json();
        const dataMasuk = await resMasuk.json();
        const dataKeluar = await resKeluar.json();

        if (Array.isArray(dataBarang)) {
          setTotalBarang(dataBarang.length);
          // Anggap stok di bawah 50 itu menipis (Bisa disesuaikan nanti)
          setStokMenipis(dataBarang.filter((b: Barang) => b.stokSekarang < 50).length);
        }

        // Gabungkan transaksi masuk dan keluar untuk timeline aktivitas
        let gabunganAktivitas: Riwayat[] = [];
        
        if (Array.isArray(dataMasuk)) {
          gabunganAktivitas = [...gabunganAktivitas, ...dataMasuk.map(m => ({
            id: m.id, nomorNota: m.nomorNota, tanggal: m.tanggal, tipe: "MASUK" as const
          }))];
        }
        
        if (Array.isArray(dataKeluar)) {
          gabunganAktivitas = [...gabunganAktivitas, ...dataKeluar.map(k => ({
            id: k.id, nomorNota: k.nomorNota, tanggal: k.tanggal, tipe: "KELUAR" as const
          }))];
        }

        // Urutkan dari yang terbaru, lalu ambil 5 teratas
        gabunganAktivitas.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        setAktivitas(gabunganAktivitas.slice(0, 5));

      } catch (error) {
        console.error("Gagal mengambil data beranda", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* HEADER BERANDA */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Selamat Datang, Wendy! 👋</h1>
        <p className="text-gray-500 mt-2 font-medium">Ini adalah ringkasan aktivitas gudang Family Jaya hari ini.</p>
      </div>

      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between group hover:border-blue-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Package size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-800">{loading ? "..." : totalBarang}</p>
            <p className="text-sm text-gray-500 font-semibold mt-1 uppercase tracking-wider">Total Jenis Barang</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between group hover:border-amber-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-3 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <AlertTriangle size={24} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-gray-800">{loading ? "..." : stokMenipis}</p>
            <p className="text-sm text-gray-500 font-semibold mt-1 uppercase tracking-wider">Stok Menipis (&lt;50)</p>
          </div>
        </div>

        <Link href="/transaksi-masuk" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between group hover:border-emerald-300 transition-colors cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ArrowDownToLine size={24} />
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">Catat Masuk</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Penerimaan dari pabrik</p>
          </div>
        </Link>

        <Link href="/transaksi-keluar" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between group hover:border-rose-300 transition-colors cursor-pointer">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-rose-50 p-3 rounded-lg text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <ArrowUpFromLine size={24} />
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-rose-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">Catat Keluar</p>
            <p className="text-sm text-gray-500 font-medium mt-1">Penjualan ke pelanggan</p>
          </div>
        </Link>

      </div>

      {/* TIMELINE AKTIVITAS TERAKHIR */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <Clock className="text-blue-500" size={20} />
          <h2 className="text-lg font-bold text-gray-800">Aktivitas Transaksi Terakhir</h2>
        </div>
        
        <div className="p-6">
          {loading ? (
            <p className="text-center text-gray-500 py-4 animate-pulse">Memuat riwayat...</p>
          ) : aktivitas.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Belum ada aktivitas transaksi.</p>
          ) : (
            <div className="space-y-6">
              {aktivitas.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    item.tipe === 'MASUK' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {item.tipe === 'MASUK' ? <ArrowDownToLine size={18} /> : <ArrowUpFromLine size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {item.tipe === 'MASUK' ? 'Penerimaan Barang' : 'Pengiriman Barang'} 
                      <span className="text-blue-600 ml-2">#{item.nomorNota}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}