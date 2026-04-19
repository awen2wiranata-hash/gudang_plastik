"use client";

import { useEffect, useState } from "react";
import * as xlsx from "xlsx"; // Mengimpor library Excel
import { Printer, Download, RefreshCw } from "lucide-react"; // Ikon tambahan

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
      if (Array.isArray(data)) setDataPeramalan(data);
    } catch (error) {
      console.error("Gagal mengambil laporan", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalBarang = dataPeramalan.length;
  const barangHabis = dataPeramalan.filter(d => d.stokSekarang === 0).length;
  const barangRestock = dataPeramalan.filter(d => d.stokSekarang > 0 && d.stokSekarang < d.smaMingguDepan).length;

  const getStatusBadge = (stok: number, prediksi: number) => {
    if (stok === 0) return <span className="bg-red-50 text-red-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-red-200 print:border-none print:px-0">Habis</span>;
    if (stok < prediksi) return <span className="bg-orange-50 text-orange-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-orange-200 print:border-none print:px-0">Restock</span>;
    return <span className="bg-emerald-50 text-emerald-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-emerald-200 print:border-none print:px-0">Cukup</span>;
  };

  // --- FUNGSI CETAK PDF ---
  const handlePrintPDF = () => {
    window.print(); // Memanggil fungsi print browser bawaan
  };

  // --- FUNGSI EXPORT EXCEL ---
  const handleExportExcel = () => {
    // 1. Format data agar rapi di Excel
    const dataExcel = dataPeramalan.map((item) => ({
      "Kode Barang": item.kodeBarang,
      "Nama Barang": item.namaBarang,
      "Terjual (3 Minggu Terakhir)": item.total3Minggu,
      "Stok Aktual": item.stokSekarang,
      "Prediksi (SMA) Minggu Depan": item.smaMingguDepan,
      "Status Gudang": item.stokSekarang === 0 ? "Habis" : item.stokSekarang < item.smaMingguDepan ? "Restock" : "Cukup",
      "Nilai Error / MAPE (%)": item.mape
    }));

    // 2. Buat file Excel dan simpan
    const worksheet = xlsx.utils.json_to_sheet(dataExcel);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan Peramalan");
    xlsx.writeFile(workbook, "Laporan_Peramalan_Family_Jaya.xlsx");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-white min-h-screen print:p-0 print:m-0">
      
      {/* HEADER: Akan disembunyikan saat di-print (print:hidden) dan diganti dengan Header Dokumen */}
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100 print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Laporan Peramalan</h1>
          <p className="text-gray-500 mt-2 font-medium">Analisis Kebutuhan Stok - Simple Moving Average</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrintPDF} className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2">
            <Printer size={18} /> Cetak PDF
          </button>
          <button onClick={handleExportExcel} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2">
            <Download size={18} /> Export Excel
          </button>
          <button onClick={fetchData} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* HEADER KHUSUS PRINT (Hanya muncul di kertas PDF) */}
      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold uppercase text-black">GUDANG FAMILY JAYA</h1>
        <p className="text-sm text-black mb-4">Laporan Analisis Peramalan Inventori (Simple Moving Average)</p>
        <div className="border-b-2 border-black w-full mb-1"></div>
        <div className="border-b border-black w-full mb-6"></div>
        <p className="text-left text-xs mb-4">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* KARTU RINGKASAN */}
      <div className="grid grid-cols-3 gap-6 mb-10 print:mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center shadow-sm print:border-gray-400 print:shadow-none print:p-4">
          <p className="text-gray-500 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Total Item</p>
          <p className="text-4xl font-black text-gray-800 print:text-black">{totalBarang}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 text-center shadow-sm print:bg-white print:border-gray-400 print:shadow-none print:p-4">
          <p className="text-orange-600 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Perlu Restock</p>
          <p className="text-4xl font-black text-orange-700 print:text-black">{barangRestock}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center shadow-sm print:bg-white print:border-gray-400 print:shadow-none print:p-4">
          <p className="text-red-600 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Stok Kosong</p>
          <p className="text-4xl font-black text-red-700 print:text-black">{barangHabis}</p>
        </div>
      </div>

      {/* TABEL DATA BERSIH */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 print:divide-black">
            <thead className="bg-gray-50 print:bg-white">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Informasi Barang</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Terjual (3 Mgg)</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Stok Aktual</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-blue-600 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Prediksi SMA</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Status</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">MAPE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 print:divide-black">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 font-medium">Menarik data analitik terbaru...</td></tr>
              ) : dataPeramalan.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400 font-medium">Belum ada data barang.</td></tr>
              ) : (
                dataPeramalan.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                    <td className="px-6 py-5 print:px-2 print:py-3">
                      <div className="text-xs text-gray-400 font-mono mb-1 print:text-black">{item.kodeBarang}</div>
                      <div className="font-bold text-gray-800 text-base print:text-black">{item.namaBarang}</div>
                    </td>
                    <td className="px-6 py-5 text-center text-gray-600 font-medium print:text-black print:px-2 print:py-3">{item.total3Minggu}</td>
                    <td className="px-6 py-5 text-center font-bold text-gray-900 text-lg print:text-black print:px-2 print:py-3">{item.stokSekarang}</td>
                    <td className="px-6 py-5 text-center print:px-2 print:py-3"><span className="text-blue-600 font-black text-xl print:text-black">{item.smaMingguDepan}</span></td>
                    <td className="px-6 py-5 text-center print:px-2 print:py-3">{getStatusBadge(item.stokSekarang, item.smaMingguDepan)}</td>
                    <td className="px-6 py-5 text-center text-gray-500 font-medium print:text-black print:px-2 print:py-3">{item.mape}%</td>
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