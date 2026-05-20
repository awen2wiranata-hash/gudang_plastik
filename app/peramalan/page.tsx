"use client";

import { useEffect, useState } from "react";
import * as xlsx from "xlsx"; 
import { Printer, Download, RefreshCw } from "lucide-react";

type HasilPeramalan = {
  id: string; kodeBarang: string; namaBarang: string; stokSekarang: number;
  tanggalAwal: string; tanggalAkhir: string; total3Minggu: number;
  smaMingguDepan: number; mape: number; 
  batasRop: number; 
  statusPeringatan: string;
};

// Tambahkan tipe untuk filter
type FilterTabel = "SEMUA" | "RESTOCK" | "KOSONG";

export default function PeramalanPage() {
  const [dataPeramalan, setDataPeramalan] = useState<HasilPeramalan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State baru untuk melacak kotak mana yang diklik
  const [filterAktiv, setFilterAktiv] = useState<FilterTabel>("SEMUA");

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

  useEffect(() => { fetchData(); }, []);

  // Logika jumlah barang untuk kotak atas
  const totalBarang = dataPeramalan.length;
  const barangHabis = dataPeramalan.filter(d => d.stokSekarang === 0).length;
  const barangRestock = dataPeramalan.filter(d => d.stokSekarang > 0 && d.statusPeringatan.includes("RESTOCK")).length;

  // Logika PENYARINGAN TABEL berdasarkan kotak yang diklik
  const dataTampil = dataPeramalan.filter((item) => {
    if (filterAktiv === "KOSONG") return item.stokSekarang === 0;
    if (filterAktiv === "RESTOCK") return item.stokSekarang > 0 && item.statusPeringatan.includes("RESTOCK");
    return true; // Jika "SEMUA", tampilkan semua data
  });

  const getStatusBadge = (stok: number, statusBackend: string) => {
    if (stok === 0) return <span className="bg-red-50 text-red-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-red-200 print:border-none print:px-0">Habis</span>;
    if (statusBackend.includes("RESTOCK")) return <span className="bg-orange-50 text-orange-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-orange-200 print:border-none print:px-0">Restock ⚠️</span>;
    return <span className="bg-emerald-50 text-emerald-600 py-1 px-4 rounded-full font-bold text-xs uppercase tracking-wider border border-emerald-200 print:border-none print:px-0">Aman ✅</span>;
  };

  const handlePrintPDF = () => window.print();

  const handleExportExcel = () => {
    // Export data yang sedang TAMPIL saja (sesuai filter)
    const dataExcel = dataTampil.map((item) => ({
      "Kode Barang": item.kodeBarang,
      "Nama Barang": item.namaBarang,
      "Periode Basis": `${new Date(item.tanggalAwal).toLocaleDateString('id-ID')} - ${new Date(item.tanggalAkhir).toLocaleDateString('id-ID')}`,
      "Terjual (3 Minggu Terakhir)": item.total3Minggu,
      "Stok Aktual": item.stokSekarang,
      "Prediksi (SMA) Minggu Depan": item.smaMingguDepan,
      "Batas Titik Pesan (ROP)": item.batasRop,
      "Status Gudang": item.stokSekarang === 0 ? "Habis" : item.statusPeringatan,
      "Nilai Error / MAPE (%)": item.mape
    }));
    const worksheet = xlsx.utils.json_to_sheet(dataExcel);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Laporan Peramalan");
    xlsx.writeFile(workbook, `Laporan_Peramalan_${filterAktiv}.xlsx`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-white min-h-screen print:p-0 print:m-0">
      
      <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-100 print:hidden">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Laporan Peramalan</h1>
          <p className="text-gray-500 mt-2 font-medium">Siklus Mingguan (Senin - Minggu) - Simple Moving Average & ROP</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handlePrintPDF} className="bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"><Printer size={18} /> Cetak PDF</button>
          <button onClick={handleExportExcel} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"><Download size={18} /> Export Excel</button>
          <button onClick={fetchData} className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2"><RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>

      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold uppercase text-black">GUDANG FAMILY JAYA</h1>
        <p className="text-sm text-black mb-4">Laporan Analisis Peramalan Inventori (Siklus Mingguan SMA & ROP)</p>
        <div className="border-b-2 border-black w-full mb-1"></div>
        <div className="border-b border-black w-full mb-6"></div>
        <p className="text-left text-xs mb-4">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* --- BAGIAN KOTAK YANG BISA DIKLIK --- */}
      <div className="grid grid-cols-3 gap-6 mb-10 print:mb-6">
        
        {/* Kotak 1: Total Item */}
        <div 
          onClick={() => setFilterAktiv("SEMUA")}
          className={`bg-white border rounded-xl p-6 text-center shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "SEMUA" ? "ring-4 ring-blue-200 border-blue-500 bg-blue-50/30" : "border-gray-200 hover:border-blue-300"}`}
        >
          <p className="text-gray-500 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Total Item</p>
          <p className="text-4xl font-black text-gray-800 print:text-black">{totalBarang}</p>
        </div>

        {/* Kotak 2: Perlu Restock */}
        <div 
          onClick={() => setFilterAktiv("RESTOCK")}
          className={`border rounded-xl p-6 text-center shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 print:bg-white print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "RESTOCK" ? "ring-4 ring-orange-200 border-orange-500 bg-orange-100" : "bg-orange-50 border-orange-100 hover:border-orange-300"}`}
        >
          <p className="text-orange-600 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Perlu Restock</p>
          <p className="text-4xl font-black text-orange-700 print:text-black">{barangRestock}</p>
        </div>

        {/* Kotak 3: Stok Kosong */}
        <div 
          onClick={() => setFilterAktiv("KOSONG")}
          className={`border rounded-xl p-6 text-center shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 print:bg-white print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "KOSONG" ? "ring-4 ring-red-200 border-red-500 bg-red-100" : "bg-red-50 border-red-100 hover:border-red-300"}`}
        >
          <p className="text-red-600 font-semibold mb-1 text-sm uppercase tracking-wider print:text-black">Stok Kosong</p>
          <p className="text-4xl font-black text-red-700 print:text-black">{barangHabis}</p>
        </div>

      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 print:divide-black">
            <thead className="bg-gray-50 print:bg-white">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Informasi Barang</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Terjual (3 Mgg)</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Stok Aktual</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-blue-600 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Prediksi Depan</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-orange-600 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Batas ROP</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Status</th>
                <th className="px-6 py-5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">MAPE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 print:divide-black">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-medium">Menarik data analitik terbaru...</td></tr>
              ) : dataTampil.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-medium">Tidak ada data untuk kategori ini.</td></tr>
              ) : (
                // MAP DATA YANG SUDAH DIFILTER DISINI (dataTampil)
                dataTampil.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors print:hover:bg-white">
                    <td className="px-6 py-5 print:px-2 print:py-3">
                      <div className="text-xs text-gray-400 font-mono mb-1 print:text-black">{item.kodeBarang}</div>
                      <div className="font-bold text-gray-800 text-base print:text-black">{item.namaBarang}</div>
                    </td>
                    <td className="px-6 py-5 text-center text-gray-600 font-medium print:text-black print:px-2 print:py-3">{item.total3Minggu}</td>
                    <td className="px-6 py-5 text-center font-bold text-gray-900 text-lg print:text-black print:px-2 print:py-3">{item.stokSekarang}</td>
                    <td className="px-6 py-5 text-center print:px-2 print:py-3"><span className="text-blue-600 font-black text-lg print:text-black">{item.smaMingguDepan}</span></td>
                    <td className="px-6 py-5 text-center print:px-2 print:py-3"><span className="text-orange-600 font-black text-lg print:text-black">{item.batasRop}</span></td>
                    <td className="px-6 py-5 text-center print:px-2 print:py-3">{getStatusBadge(item.stokSekarang, item.statusPeringatan)}</td>
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