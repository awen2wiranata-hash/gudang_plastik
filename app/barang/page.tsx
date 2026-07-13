"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react"; // 🛠️ TAMBAH ICON: Search
import * as xlsx from "xlsx";

type Barang = {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string | null;
  stokSekarang: number;
  isAktif: boolean;
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

  // 🛠️ STATE BARU: Untuk pencarian dan filter status barang
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"SEMUA" | "AKTIF" | "NONAKTIF">("SEMUA");

  const [sortConfig, setSortConfig] = useState<{ key: keyof Barang; direction: "asc" | "desc" } | null>(null);

  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang?activeOnly=false");
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

  // FUNGSI TOGGLE STATUS (AKTIF / NONAKTIF)
  const handleToggleAktif = async (id: string, nama: string, statusSekarang: boolean) => {
    const tindakan = statusSekarang ? "menonaktifkan" : "mengaktifkan kembali";
    const konfirmasi = confirm(`Apakah Anda yakin ingin ${tindakan} produk plastik "${nama}"?\n\nBarang yang dinonaktifkan tidak akan muncul pada pilihan form transaksi keluar/masuk baru.`);
    
    if (konfirmasi) {
      try {
        const res = await fetch("/api/barang", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: id, 
            isToggleStatus: true, 
            isAktif: !statusSekarang
          })
        });

        const data = await res.json();
        if (res.ok) {
          alert(data.message);
          fetchBarang(); 
        } else {
          alert(data.error || "Gagal memperbarui status barang.");
        }
      } catch (error) {
        console.error(error);
      }
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
        
        const jsonArray = xlsx.utils.sheet_to_json(worksheet);

        const res = await fetch("/api/import/barang", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonArray),
        });

        const result = await res.json();
        const responseData: ImportLogData = {
          sukses: result.sukses ?? 0,
          gagal: result.gagal ?? 0,
          detailGagal: result.detailGagal ?? []
        };
        setImportLog(responseData);
        
        if (responseData.sukses > 0) {
          fetchBarang(); 
        }
      } catch (error) {
        console.error("Gagal import:", error);
        alert("Gagal membaca file excel. Pastikan format benar.");
      } finally {
        setIsImporting(false);
        e.target.value = ""; 
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
        const data = await res.json();
        
        if (res.ok) {
          alert("Barang berhasil dihapus!");
          fetchBarang();
        } else {
          alert(data.error || "Gagal menghapus data barang.");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }
  };

  // 🛠️ LOGIKA LOGIKAL FILTER (SEARCH & STATUS TOGGLE)
  const filteredBarang = daftarBarang.filter((item) => {
    const cocokKataKunci = 
      item.namaBarang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kodeBarang.toLowerCase().includes(searchTerm.toLowerCase());

    const cocokStatus = 
      statusFilter === "SEMUA" ||
      (statusFilter === "AKTIF" && item.isAktif) ||
      (statusFilter === "NONAKTIF" && !item.isAktif);

    return cocokKataKunci && cocokStatus;
  });

// 🛠️ FUNGSI BARU: Untuk mengubah arah sorting saat judul diklik
  const requestSort = (key: keyof Barang) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"; // Jika sudah A-Z, ubah ke Z-A
    }
    setSortConfig({ key, direction });
  };

  // 🛠️ LOGIKA BARU: Mengurutkan data yang sudah difilter
  const sortedBarang = [...filteredBarang].sort((a, b) => {
    if (!sortConfig) return 0; // Jika tidak ada sort, biarkan urutan asli
    
    const { key, direction } = sortConfig;
    let aValue = a[key] ?? "";
    let bValue = b[key] ?? "";

    // Ubah ke huruf kecil semua jika berupa teks agar A-Z akurat
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // 🛠️ KOMPONEN ICON PANAH KECIL UNTUK JUDUL TABEL
  const SortIcon = ({ columnKey }: { columnKey: keyof Barang }) => {
    if (sortConfig?.key !== columnKey) return <span className="ml-1 text-gray-300">↕</span>;
    return sortConfig.direction === "asc" ? <span className="ml-1 text-blue-600">▲</span> : <span className="ml-1 text-blue-600">▼</span>;
  };

  return (
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      
      {/* HEADER DENGAN TOMBOL IMPORT */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Master Data Barang Plastik</h1>
        
        <label className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer transition-all shadow-sm ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}>
          {isImporting ? "Memproses Data..." : "Import Data Excel"}
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

      {/* FORM INPUT / EDIT */}
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

      {/* TABEL DATA & KOMPONEN FILTER BARU */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
        
        {/* 🛠️ MODIFIKASI HEADER TABEL: Penyematan Search Bar & Filter Status */}
        <div className="p-5 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-center w-full">
          <h2 className="text-lg font-bold text-gray-800 w-full md:w-auto">Daftar Keseluruhan Katalog Barang Gudang</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
            {/* INPUT KOTAK PENCARIAN (SEARCH BAR) */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Cari kode atau nama barang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 text-gray-900 font-medium rounded-lg outline-none bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs">✕</button>
              )}
            </div>

            {/* SEGMENTED BUTTON CONTROL (TAB FILTER STATUS) */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-full sm:w-auto text-center shadow-inner">
              {(["SEMUA", "AKTIF", "NONAKTIF"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-black tracking-wide rounded-md transition-all ${
                    statusFilter === filter 
                      ? "bg-white text-blue-600 shadow-sm border border-gray-200/50" 
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {filter === "SEMUA" ? "Semua" : filter === "AKTIF" ? "Aktif" : "Nonaktif"}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full">
      <table className="min-w-full divide-y divide-gray-200 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th onClick={() => requestSort('kodeBarang')} className="cursor-pointer hover:bg-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider transition-colors">
                  Kode <SortIcon columnKey="kodeBarang" />
                </th>
                <th onClick={() => requestSort('namaBarang')} className="cursor-pointer hover:bg-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider transition-colors">
                  Nama Barang <SortIcon columnKey="namaBarang" />
                </th>
                <th onClick={() => requestSort('kategori')} className="cursor-pointer hover:bg-gray-200 px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider transition-colors">
                  Kategori <SortIcon columnKey="kategori" />
                </th>
                <th onClick={() => requestSort('stokSekarang')} className="cursor-pointer hover:bg-gray-200 px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider transition-colors">
                  Stok Saat Ini <SortIcon columnKey="stokSekarang" />
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 font-medium text-gray-400">Sedang memuat katalog data...</td></tr>
              ) : sortedBarang.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 font-medium text-gray-400">Data barang tidak ditemukan.</td></tr>
              ) : (
                /* 🛠️ UBAH: Ganti filteredBarang.map menjadi sortedBarang.map */
                sortedBarang.map((item) => (
                  <tr key={item.id} className={`transition-colors ${!item.isAktif ? 'bg-gray-100/70 text-gray-400 select-none' : 'hover:bg-gray-50'}`}>
                    {/* ... isi tr dan td sama persis seperti kode asli Anda ... */}
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.kodeBarang}</td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${item.isAktif ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                      {item.namaBarang}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{item.kategori || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-4 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full border ${item.isAktif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                        {item.stokSekarang} Pcs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 inline-flex text-xs font-black tracking-wide rounded-full border shadow-sm ${item.isAktif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-300 text-gray-600 border-gray-400'}`}>
                        {item.isAktif ? "AKTIF" : "NONAKTIF / ARSIP"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2.5">
                        {item.isAktif && (
                          <button onClick={() => klikEdit(item)} className="text-amber-600 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-200 text-xs">Edit</button>
                        )}
                        <button 
                          onClick={() => handleToggleAktif(item.id, item.namaBarang, item.isAktif)}
                          className={`font-bold px-3 py-1.5 rounded-lg transition-colors border text-xs ${
                            item.isAktif 
                              ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300' 
                              : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                          }`}
                        >
                          {item.isAktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button onClick={() => klikHapus(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-200 text-xs">Hapus</button>
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