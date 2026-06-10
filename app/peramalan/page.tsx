"use client";

import { useEffect, useState } from "react";
import * as xlsx from "xlsx"; 
import { Printer, Download, RefreshCw, BarChart3, AlertTriangle, XCircle, ShieldCheck, Search } from "lucide-react";

type HasilPeramalan = {
  id: string; kodeBarang: string; namaBarang: string; stokSekarang: number;
  tanggalAwal: string; tanggalAkhir: string; total3Minggu: number;
  smaMingguDepan: number; mape: number; 
  batasRop: number; 
  statusPeringatan: string;
};

type FilterTabel = "SEMUA" | "RESTOCK" | "KOSONG";

export default function PeramalanPage() {
  const [dataPeramalan, setDataPeramalan] = useState<HasilPeramalan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAktiv, setFilterAktiv] = useState<FilterTabel>("SEMUA");
  
  // --- STATE BARU UNTUK FITUR PENCARIAN ---
  const [kataKunci, setKataKunci] = useState("");

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

  const totalBarang = dataPeramalan.length;
  const barangHabis = dataPeramalan.filter(d => d.stokSekarang === 0).length;
  const barangRestock = dataPeramalan.filter(d => d.stokSekarang > 0 && d.statusPeringatan.includes("RESTOCK")).length;

  // --- MODIFIKASI LOGIKA PENYARINGAN (GABUNGAN KOTAK & SEARCH BAR) ---
  const dataTampil = dataPeramalan.filter((item) => {
    // 1. Filter Berdasarkan Kotak Atas
    if (filterAktiv === "KOSONG" && item.stokSekarang !== 0) return false;
    if (filterAktiv === "RESTOCK" && !(item.stokSekarang > 0 && item.statusPeringatan.includes("RESTOCK"))) return false;

    // 2. Filter Berdasarkan Kata Kunci Search Bar (Cari via Nama atau Kode Barang)
    const matchNama = item.namaBarang.toLowerCase().includes(kataKunci.toLowerCase());
    const matchKode = item.kodeBarang.toLowerCase().includes(kataKunci.toLowerCase());
    
    return matchNama || matchKode;
  });

  const getStatusBadge = (stok: number, statusBackend: string) => {
    if (stok === 0) {
      return (
        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 py-1 px-3 rounded-full font-bold text-xs uppercase tracking-wider border border-red-200 print:border-none print:px-0">
          <XCircle size={12} /> Habis
        </span>
      );
    }
    if (statusBackend.includes("RESTOCK")) {
      return (
        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 py-1 px-3 rounded-full font-bold text-xs uppercase tracking-wider border border-amber-200 print:border-none print:px-0">
          <AlertTriangle size={12} /> Restock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 py-1 px-3 rounded-full font-bold text-xs uppercase tracking-wider border border-emerald-200 print:border-none print:px-0">
        <ShieldCheck size={12} /> Aman
      </span>
    );
  };

  const handlePrintPDF = () => window.print();

  const handleExportExcel = () => {
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
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen print:bg-white print:p-0 print:m-0">
      
      {/* HEADER UTAMA WEB */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-gray-200 print:hidden gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">📊 Laporan & Analisis Peramalan</h1>
          <p className="text-gray-500 mt-1.5 font-medium text-sm">Siklus Evaluasi Stok Mingguan — Simple Moving Average (SMA) & Reorder Point (ROP)</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={handlePrintPDF} className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-5 rounded-lg transition-all text-sm flex items-center gap-2 shadow-sm"><Printer size={16} /> Cetak PDF</button>
          <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm flex items-center gap-2 shadow-sm"><Download size={16} /> Export Excel</button>
          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all text-sm flex items-center gap-2 shadow-sm"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>

      {/* HEADER KHUSUS CETAK FISIK / PDF */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-3xl font-black uppercase text-black tracking-wide">GUDANG FAMILY JAYA</h1>
        <p className="text-sm text-gray-700 font-medium tracking-wide mt-1">Laporan Hasil Peramalan Stok & Batas Minimum Pemesanan (Siklus SMA & ROP)</p>
        <div className="border-b-4 border-black w-full mt-3 mb-1"></div>
        <div className="border-b border-black w-full mb-4"></div>
        <div className="flex justify-between text-xs text-black font-medium px-1">
          <p>Kategori Data: <span className="font-bold uppercase">{filterAktiv}</span></p>
          <p>Waktu Cetak Dokumen: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:mb-6 print:gap-4">
        <div 
          onClick={() => setFilterAktiv("SEMUA")}
          className={`bg-white border rounded-xl p-5 shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "SEMUA" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/20" : "border-gray-200 hover:border-blue-400 hover:shadow-md"}`}
        >
          <div className="text-left">
            <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Total Item Katalog</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalBarang}</p>
          </div>
          <div className={`p-3 rounded-lg ${filterAktiv === "SEMUA" ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600"} print:hidden`}>
            <BarChart3 size={24} />
          </div>
        </div>

        <div 
          onClick={() => setFilterAktiv("RESTOCK")}
          className={`bg-white border rounded-xl p-5 shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "RESTOCK" ? "ring-2 ring-amber-500 border-amber-500 bg-amber-50/20" : "border-gray-200 hover:border-amber-400 hover:shadow-md"}`}
        >
          <div className="text-left">
            <p className="text-amber-600 font-bold text-xs uppercase tracking-wider print:text-gray-500">Perlu Batas Restock</p>
            <p className="text-3xl font-black text-amber-700 mt-1 print:text-black">{barangRestock}</p>
          </div>
          <div className={`p-3 rounded-lg ${filterAktiv === "RESTOCK" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-600"} print:hidden`}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div 
          onClick={() => setFilterAktiv("KOSONG")}
          className={`bg-white border rounded-xl p-5 shadow-sm cursor-pointer transition-all duration-200 flex items-center justify-between print:border-gray-400 print:shadow-none print:p-4
            ${filterAktiv === "KOSONG" ? "ring-2 ring-red-500 border-red-500 bg-red-50/20" : "border-gray-200 hover:border-red-400 hover:shadow-md"}`}
        >
          <div className="text-left">
            <p className="text-red-600 font-bold text-xs uppercase tracking-wider print:text-gray-500">Kondisi Stok Kosong</p>
            <p className="text-3xl font-black text-red-700 mt-1 print:text-black">{barangHabis}</p>
          </div>
          <div className={`p-3 rounded-lg ${filterAktiv === "KOSONG" ? "bg-red-500 text-white" : "bg-red-50 text-red-600"} print:hidden`}>
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* STRIP DATA UTAMA TABEL */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm print:border-none print:shadow-none w-full">
        
        {/* --- PANEL ATAS TABEL: JUDUL & SEARCH BAR --- */}
        <div className="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📋 Rincian Analisis Data <span className="text-xs bg-gray-100 border text-gray-600 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">{filterAktiv}</span>
          </h2>
          
          {/* SEARH BAR INPUT FIELD (Huruf Hitam Kontras Tinggi) */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari nama atau kode barang..."
              className="w-full border border-gray-300 pl-10 pr-4 py-2 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-sm transition-all placeholder:text-gray-400 bg-white"
            />
            {kataKunci && (
              <button 
                onClick={() => setKataKunci("")} 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 w-full print:divide-black">
            <thead className="bg-gray-50 print:bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Informasi Katalog Barang</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Penjualan (5 Mgg)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Stok Aktual</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-blue-600 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Prediksi</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-amber-600 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Minimum Stok</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Status Gudang</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider print:text-black print:border-b print:border-black print:px-2">Nilai MAPE</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 print:divide-gray-400">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-bold text-sm tracking-wide">🔄 Sinkronisasi kalkulasi analitik database terbaru...</td></tr>
              ) : dataTampil.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-bold text-sm tracking-wide">⚠️ Tidak ada catatan produk dalam kriteria filter atau kata kunci ini.</td></tr>
              ) : (
                dataTampil.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors print:hover:bg-white">
                    <td className="px-6 py-4 print:px-1 print:py-2.5">
                      <div className="text-xs text-gray-400 font-bold font-mono tracking-tight print:text-black">{item.kodeBarang}</div>
                      <div className="font-extrabold text-gray-900 text-base mt-0.5 print:text-black print:text-sm">{item.namaBarang}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-800 font-bold text-base print:text-black print:px-1 print:py-2.5 print:text-sm">{item.total3Minggu} Pcs</td>
                    <td className="px-6 py-4 text-center font-black text-gray-900 text-base print:text-black print:px-1 print:py-2.5 print:text-sm">{item.stokSekarang} Pcs</td>
                    <td className="px-6 py-4 text-center print:px-1 print:py-2.5">
                      <span className="text-blue-600 font-black text-base print:text-black print:text-sm">{item.smaMingguDepan} Pcs</span>
                    </td>
                    <td className="px-6 py-4 text-center print:px-1 print:py-2.5">
                      <span className="text-amber-600 font-black text-base print:text-black print:text-sm">{item.batasRop} Pcs</span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap print:px-1 print:py-2.5 print:text-sm">{getStatusBadge(item.stokSekarang, item.statusPeringatan)}</td>
                    <td className="px-6 py-4 text-center text-gray-900 font-extrabold text-base print:text-black print:px-1 print:py-2.5 print:text-sm">{item.mape}%</td>
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