"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

type Customer = {
  id: string;
  nama: string;
  kontak: string | null;
  alamat: string | null;
};

export default function MasterCustomerPage() {
  const [daftarCustomer, setDaftarCustomer] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  
  // State Pengendali Mode Edit
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchCustomer = async () => {
    try {
      const res = await fetch("/api/customer");
      const data = await res.json();
      if (Array.isArray(data)) setDaftarCustomer(data);
      else setDaftarCustomer([]);
    } catch (error) {
      console.error("Gagal mengambil data", error);
      setDaftarCustomer([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/customer";
      const method = editingId ? "PUT" : "POST";
      const bodyData = editingId 
        ? { id: editingId, nama, kontak, alamat } 
        : { nama, kontak, alamat };

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setNama("");
        setKontak("");
        setAlamat("");
        setEditingId(null);
        fetchCustomer();
        alert(editingId ? "Data pelanggan berhasil diperbarui!" : "Pelanggan/Toko berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Gagal memproses pelanggan", error);
    }
  };

  const handleEditClick = (item: Customer) => {
    setEditingId(item.id);
    setNama(item.nama);
    setKontak(item.kontak || "");
    setAlamat(item.alamat || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNama("");
    setKontak("");
    setAlamat("");
  };

  const handleDelete = async (id: string, namaToko: string) => {
    if (confirm(`Apakah Anda yakin mau menghapus toko [${namaToko}]?\nTindakan ini otomatis tercatat di data forensik digital.`)) {
      try {
        const res = await fetch(`/api/customer?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchCustomer();
          alert("Data pelanggan sukses dihapus!");
        } else {
          const err = await res.json();
          alert(err.error || "Gagal menghapus data");
        }
      } catch (error) {
        console.error("Gagal menghapus pelanggan", error);
      }
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  return (
    /* MODIFIKASI: max-w-none w-full agar layout memenuhi kanan dan kiri layar */
    <div className="p-8 max-w-none w-full px-4 md:px-12 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 tracking-tight">Master Data Pelanggan / Toko</h1>

      {/* Form Card Dinamis - Memenuhi Layar */}
      <div className={`p-6 rounded-xl shadow-sm mb-8 border transition-all ${editingId ? "bg-amber-50 border-amber-300" : "bg-white border-gray-200"}`}>
        <h2 className={`text-xl font-bold mb-5 ${editingId ? "text-amber-800" : "text-gray-800"}`}>
          {editingId ? "🛠️ Mode Perubahan Data Pelanggan" : "Tambah Pelanggan Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* MODIFIKASI: text-gray-900 font-medium & focus:text-black membuat tulisan hitam tajam saat mengetik */}
            <div className="flex-[2]">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nama Toko / Pelanggan</label>
              <input 
                type="text" 
                required 
                value={nama} 
                onChange={(e) => setNama(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-gray-400 bg-white" 
                placeholder="Contoh: Toko Berkah Plastik" 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nomor Telepon</label>
              <input 
                type="text" 
                value={kontak} 
                onChange={(e) => setKontak(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-gray-400 bg-white" 
                placeholder="Contoh: 0812..." 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Alamat Pengiriman</label>
            <input 
              type="text" 
              value={alamat} 
              onChange={(e) => setAlamat(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 font-medium focus:text-black focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-gray-400 bg-white" 
              placeholder="Contoh: Pasar Tengah Blok A" 
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 font-bold py-2.5 px-6 rounded-lg text-sm transition-colors">
                <X size={16} /> Batal
              </button>
            )}
            <button type="submit" className={`inline-flex items-center gap-1.5 font-bold py-2.5 px-8 rounded-lg text-sm text-white transition-colors shadow-sm ${editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"}`}>
              {editingId ? <Check size={16} /> : null}
              {editingId ? "Simpan Perubahan" : "Simpan Pelanggan"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Data - Stretch Memenuhi Kanan Kiri */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full text-sm">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Daftar Pelanggan Terdaftar</h2>
        </div>
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama Toko/Pelanggan</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alamat</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 text-gray-600">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 font-medium text-gray-400 animate-pulse">Memuat data pelanggan...</td></tr>
              ) : daftarCustomer.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400 font-medium">Belum ada data pelanggan di database.</td></tr>
              ) : (
                daftarCustomer.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.nama}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{item.kontak || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate font-medium">{item.alamat || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => handleEditClick(item)} className="text-amber-600 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition-colors border border-amber-200" title="Edit Data">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id, item.nama)} className="text-red-600 hover:text-red-900 font-bold bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-200" title="Hapus Pelanggan">
                          Hapus
                        </button>
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