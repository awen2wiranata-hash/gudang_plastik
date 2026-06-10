"use client";

import { useEffect, useState } from "react";
import * as xlsx from "xlsx"; // Pastikan library ini sudah terinstall

type Barang = {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string | null;
  stokSekarang: number;
};

type ImportLogData = {
  message?: string;
  sukses: number;
  gagal: number;
  detailGagal: string[];
};

export default function MasterBarangPage() {
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [kodeBarang, setKodeBarang] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("");

  // Mode Edit State
  const [modeEdit, setModeEdit] = useState(false);
  const [idEdit, setIdEdit] = useState("");

  // State untuk Import Excel
  const [isImporting, setIsImporting] = useState(false);
  const [importLog, setImportLog] = useState<ImportLogData | null>(null);

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang");
      const data = await res.json();
      if (Array.isArray(data)) setDaftarBarang(data);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  // FUNGSI SIMPAN MANUAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/barang";
      const method = modeEdit ? "PUT" : "POST"; 
      const payload = modeEdit 
        ? { id: idEdit, kodeBarang, namaBarang, kategori }
        : { kodeBarang, namaBarang, kategori };

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        batalEdit(); 
        fetchBarang(); 
        alert(modeEdit ? "Data berhasil diupdate!" : "Barang berhasil ditambahkan!");
      } else {
        alert("Terjadi kesalahan saat menyimpan data.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // FUNGSI IMPORT EXCEL
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportLog(null);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = xlsx.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Ubah Excel jadi JSON
        const jsonArray = xlsx.utils.sheet_to_json(worksheet);

        // Kirim ke Backend
        const res = await fetch("/api/import/barang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonArray),
        });

        const result = await res.json();
        setImportLog(result);
        
        if (result.sukses > 0) {
          fetchBarang(); 
        }
      } catch (error) {
        console.error("Gagal import:", error);
        alert("Gagal membaca file excel. Pastikan format benar.");
      } finally {
        setIsImporting(false);
        e.target.value = ""; // Reset input file
      }
    };
    reader.readAsBinaryString(file);
  };

  const klikEdit = (barang: Barang) => {
    setModeEdit(true);
    setIdEdit(barang.id);
    setKodeBarang(barang.kodeBarang);
    setNamaBarang(barang.namaBarang);
    setKategori(barang.kategori || "");
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const batalEdit = () => {
    setModeEdit(false);
    setIdEdit("");
    setKodeBarang("");
    setNamaBarang("");
    setKategori("");
  };

  const klikHapus = async (id: string, nama: string) => {
    const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus barang "${nama}"?\n\nPERINGATAN: Barang tidak bisa dihapus jika sudah memiliki riwayat transaksi masuk/keluar.`);
    if (konfirmasi) {
      try {
        const res = await fetch(`/api/barang?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          alert("Barang berhasil dihapus!");
          fetchBarang();
        } else {
          alert("Gagal menghapus. Kemungkinan barang ini sedang dipakai di data transaksi.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  return (
    /* MODIFIKASI: max-w-none w-full agar layout memenuhi kanan dan kiri layar laptop */
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      
      {/* HEADER DENGAN TOMBOL IMPORT */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">📦 Master Data Barang Plastik</h1>
        
        <label className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
          {isImporting ? "Memproses Data..." : "📥 Import Data Excel"}
          <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
        </label>
      </div>

      {/* LOG HASIL IMPORT */}
      {importLog && (
        <div className="mb-8 p-4 bg-white border border-gray-200 shadow-sm rounded-xl text-sm">
          <p className="font-bold text-gray-800 mb-2">📋 Laporan Hasil Import:</p>
          <p className="text-green-600 font-semibold">✓ Berhasil ditambahkan: {importLog.sukses} barang</p>
          <p className="text-red-500 font-semibold mb-2">✗ Gagal / Dilewati (Duplikat): {importLog.gagal} barang</p>
          {importLog.detailGagal && importLog.detailGagal.length > 0 && (
            <ul className="list-disc list-inside text-gray-500 text-xs max-h-24 overflow-y-auto font-mono">
              {importLog.detailGagal.map((pesan: string, i: number) => (
                <li key={i}>{pesan}</li>
              ))}
            </ul>
          )}
          <button onClick={() => setImportLog(null)} className="mt-3 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors border border-gray-200">Tutup Pesan</button>
        </div>
      )}

      {/* FORM INPUT / EDIT - Memenuhi Kanan Kiri */}
      <div className={`p-6 rounded-xl shadow-sm mb-8 border transition-all ${modeEdit ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-5">
          <h2 className={`text-xl font-bold ${modeEdit ? 'text-amber-800' : 'text-gray-800'}`}>
            {modeEdit ? "✏️ Mode Perubahan Data Barang" : "Tambah Data Barang Baru"}
          </h2>
          {modeEdit && (
            <button type="button" onClick={batalEdit} className="text-sm font-bold text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg border border-red-200 transition-colors">
              ✕ Batal Perubahan
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          {/* MODIFIKASI: Menambahkan text-gray-900 font-medium agar huruf saat diketik menjadi hitam pekat */}
          <div className="w-full md:flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Kode Barang</label>
            <input 
              type="text" 
              required 
              value={kodeBarang} 
              onChange={(e) => setKodeBarang(e.target.value)} 
              className="w-full border border-gray-300 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 outline-none placeholder:text-gray-400 bg-white" 
              placeholder="Contoh: PLS-001" 
            />
          </div>
          <div className="w-full md:flex-[2]">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Barang</label>
            <input 
              type="text" 
              required 
              value={namaBarang} 
              onChange={(e) => setNamaBarang(e.target.value)} 
              className="w-full border border-gray-300 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 outline-none placeholder:text-gray-400 bg-white" 
              placeholder="Contoh: Gelas Plastik 16oz" 
            />
          </div>
          <div className="w-full md:flex-1">
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Kategori</label>
            <input 
              type="text" 
              value={kategori} 
              onChange={(e) => setKategori(e.target.value)} 
              className="w-full border border-gray-300 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg p-2.5 outline-none placeholder:text-gray-400 bg-white" 
              placeholder="Contoh: Gelas" 
            />
          </div>
          <button type="submit" className={`w-full md:w-auto font-bold py-2.5 px-8 rounded-lg shadow-sm text-white transition-all ${modeEdit ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {modeEdit ? "Simpan Pembaruan" : "Simpan Barang"}
          </button>
        </form>
      </div>

      {/* TABEL DATA - Memenuhi Kanan Kiri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Daftar Keseluruhan Katalog Barang Gudang</h2>
        </div>
        
        {/* Pembungkus agar tabel responsif penuh */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kode</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Barang</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Stok Saat Ini</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 font-medium text-gray-400">Sedangkan memuat katalog data...</td></tr>
              ) : daftarBarang.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 font-medium text-gray-400">Belum ada data barang di database.</td></tr>
              ) : (
                daftarBarang.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.kodeBarang}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">{item.namaBarang}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">{item.kategori || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full bg-green-50 text-green-700 border border-green-200">
                        {item.stokSekarang} Pcs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => klikEdit(item)} className="text-amber-600 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors border border-amber-200">Edit</button>
                        <button onClick={() => klikHapus(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-200">Hapus</button>
                      </div>
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