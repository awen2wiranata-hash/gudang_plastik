"use client";

import { useEffect, useState } from "react";

type HasilPeramalan = {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  stokSekarang: number;
  tanggalAwal: string;
  tanggalAkhir: string;
  total3Minggu: number;
  smaMingguDepan: number;
  mape: number;
};

export default function PeramalanPage() {
  const [dataPeramalan, setDataPeramalan] = useState<HasilPeramalan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/peramalan");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDataPeramalan(data);
      }
    } catch (error) {
      console.error("Gagal mengambil laporan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fungsi untuk menentukan Status dan Warna Badge
  const getStatusBadge = (stok: number, prediksi: number) => {
    if (stok === 0) {
      return (
        <span className="bg-red-100 border border-red-200 text-red-700 py-1 px-3 rounded-full font-extrabold text-xs uppercase tracking-wider shadow-sm animate-pulse">
          Habis 🚨
        </span>
      );
    } else if (stok < prediksi) {
      return (
        <span className="bg-amber-100 border border-amber-200 text-amber-700 py-1 px-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm">
          Restock ⚠️
        </span>
      );
    } else {
      return (
        <span className="bg-emerald-100 border border-emerald-200 text-emerald-700 py-1 px-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm">
          Cukup ✅
        </span>
      );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📈 Dashboard Peramalan Otomatis</h1>
          <p className="text-gray-500 mt-2">Sistem otomatis menghitung Simple Moving Average (SMA) dan memberikan rekomendasi status stok.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2"
        >
          🔄 Refresh Data
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header Penjelasan */}
        <div className="bg-slate-50 border-b border-gray-200 p-4 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Metode Prediksi</p>
              <p className="text-sm font-medium text-gray-800">Simple Moving Average (3 Minggu)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Akurasi (MAPE)</p>
              <p className="text-sm font-medium text-gray-800">Komparasi data minggu ke-4</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Status Gudang</p>
              <p className="text-sm font-medium text-gray-800">Indikator Cukup / Restock / Habis</p>
            </div>
          </div>
        </div>

        {/* Tabel Data */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Kode / Nama Barang</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Periode (3 Minggu)</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Terjual</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Sisa Stok</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-blue-300">Prediksi SMA</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-rose-300">MAPE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 font-medium text-blue-600 animate-pulse">Menghitung seluruh data & status...</td></tr>
              ) : dataPeramalan.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Belum ada barang di database</td></tr>
              ) : (
                dataPeramalan.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600 font-mono mb-1">{item.kodeBarang}</div>
                      <div className="font-bold text-gray-900">{item.namaBarang}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-600">
                      {new Date(item.tanggalAwal).toLocaleDateString('id-ID')} - {new Date(item.tanggalAkhir).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      {item.total3Minggu} unit
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-800">
                        {item.stokSekarang} unit
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-blue-50 border border-blue-200 text-blue-800 py-1.5 px-4 rounded-md font-extrabold text-lg shadow-sm">
                        {item.smaMingguDepan}
                      </span>
                    </td>
                    {/* KOLOM STATUS BARU */}
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(item.stokSekarang, item.smaMingguDepan)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-rose-600">
                        {item.mape}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}