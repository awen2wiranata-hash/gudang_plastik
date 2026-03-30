"use client";

import { useEffect, useState } from "react";

// Tipe data agar TypeScript tidak bingung
type Barang = {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string | null;
  stokSekarang: number;
};

export default function MasterBarangPage() {
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [kodeBarang, setKodeBarang] = useState("");
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("");

  // Fungsi untuk mengambil data dari API yang kita buat sebelumnya
  const fetchBarang = async () => {
    try {
      const res = await fetch("/api/barang");
      const data = await res.json();
      setDaftarBarang(data);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengirim data barang baru ke API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kodeBarang, namaBarang, kategori, leadTime: 1 }),
      });

      if (res.ok) {
        // Kosongkan form dan refresh tabel
        setKodeBarang("");
        setNamaBarang("");
        setKategori("");
        fetchBarang();
        alert("Barang plastik berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Gagal menambah barang", error);
    }
  };

  // Jalankan fetchBarang saat halaman pertama kali dibuka
  useEffect(() => {
    fetchBarang();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📦 Master Barang Gudang Plastik</h1>

      {/* Form Tambah Barang */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Tambah Jenis Plastik Baru</h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
            <input 
              type="text" 
              required
              value={kodeBarang}
              onChange={(e) => setKodeBarang(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2" 
              placeholder="Contoh: PLS-001" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
            <input 
              type="text" 
              required
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2" 
              placeholder="Contoh: Gelas Plastik 16oz" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <input 
              type="text" 
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2" 
              placeholder="Contoh: Gelas / Mika" 
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
          >
            Simpan
          </button>
        </form>
      </div>

      {/* Tabel Daftar Barang */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Saat Ini</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-4">Memuat data...</td></tr>
            ) : daftarBarang.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-4 text-gray-500">Belum ada barang plastik. Silakan tambah di atas!</td></tr>
            ) : (
              daftarBarang.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.kodeBarang}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.namaBarang}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.kategori || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full font-bold">
                      {item.stokSekarang}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}