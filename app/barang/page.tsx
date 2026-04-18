"use client";

import { useEffect, useState } from "react";

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

  // Mode Edit State
  const [modeEdit, setModeEdit] = useState(false);
  const [idEdit, setIdEdit] = useState("");

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

  // FUNGSI SIMPAN (Bisa untuk Tambah Baru ATAU Simpan Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/barang";
      const method = modeEdit ? "PUT" : "POST"; // Jika edit gunakan PUT, jika baru gunakan POST
      const payload = modeEdit 
        ? { id: idEdit, kodeBarang, namaBarang, kategori }
        : { kodeBarang, namaBarang, kategori };

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        batalEdit(); // Kosongkan form
        fetchBarang(); // Refresh tabel
        alert(modeEdit ? "Data berhasil diupdate!" : "Barang berhasil ditambahkan!");
      } else {
        alert("Terjadi kesalahan saat menyimpan data.");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // FUNGSI SAAT TOMBOL EDIT DIKLIK
  const klikEdit = (barang: Barang) => {
    setModeEdit(true);
    setIdEdit(barang.id);
    setKodeBarang(barang.kodeBarang);
    setNamaBarang(barang.namaBarang);
    setKategori(barang.kategori || "");
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke atas
  };

  // FUNGSI BATAL EDIT
  const batalEdit = () => {
    setModeEdit(false);
    setIdEdit("");
    setKodeBarang("");
    setNamaBarang("");
    setKategori("");
  };

  // FUNGSI HAPUS
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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📦 Master Barang Plastik</h1>

      {/* FORM INPUT / EDIT */}
      <div className={`p-6 rounded-lg shadow-md mb-8 border ${modeEdit ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-semibold ${modeEdit ? 'text-amber-800' : 'text-gray-700'}`}>
            {modeEdit ? "✏️ Edit Barang" : "Tambah Barang Baru"}
          </h2>
          {modeEdit && (
            <button type="button" onClick={batalEdit} className="text-sm font-bold text-red-500 hover:underline">
              X Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
            <input type="text" required value={kodeBarang} onChange={(e) => setKodeBarang(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: PLS-001" />
          </div>
          <div className="flex-[2]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
            <input type="text" required value={namaBarang} onChange={(e) => setNamaBarang(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Gelas Plastik 16oz" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <input type="text" value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Gelas" />
          </div>
          <button type="submit" className={`${modeEdit ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-6 rounded-md transition-colors`}>
            {modeEdit ? "Simpan Perubahan" : "Simpan Barang"}
          </button>
        </form>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Barang</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stok Saat Ini</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Memuat data...</td></tr>
            ) : daftarBarang.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-gray-500">Belum ada data barang.</td></tr>
            ) : (
              daftarBarang.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.kodeBarang}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.namaBarang}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.kategori || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {item.stokSekarang}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {/* TOMBOL AKSI */}
                    <div className="flex justify-center gap-3">
                      <button onClick={() => klikEdit(item)} className="text-amber-600 hover:text-amber-900 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">Edit</button>
                      <button onClick={() => klikHapus(item.id, item.namaBarang)} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md border border-red-200">Hapus</button>
                    </div>
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