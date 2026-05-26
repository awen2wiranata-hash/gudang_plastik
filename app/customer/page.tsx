"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, X, Check } from "lucide-react";

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
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">👥 Master Pelanggan / Toko</h1>

      {/* Form Card Dinamis */}
      <div className={`p-6 rounded-xl shadow-sm mb-8 border transition-all ${editingId ? "bg-amber-50/50 border-amber-200" : "bg-white border-gray-200"}`}>
        <h2 className="text-xl font-bold mb-4 text-gray-700">
          {editingId ? "🛠️ Mode Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[2]">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Toko / Pelanggan</label>
              <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: Toko Berkah Plastik" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nomor Telepon</label>
              <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: 0812..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Alamat Pengiriman</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: Pasar Tengah Blok A" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                <X size={16} /> Batal
              </button>
            )}
            <button type="submit" className={`inline-flex items-center gap-1 font-bold py-2 px-6 rounded-xl text-sm text-white transition-colors shadow-sm ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {editingId ? <Check size={16} /> : null}
              {editingId ? "Simpan Perubahan" : "Simpan Pelanggan"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Data */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden text-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 font-semibold">
            <tr>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Nama Toko/Pelanggan</th>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Kontak</th>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Alamat</th>
              <th className="px-6 py-4 text-center text-xs text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 font-medium animate-pulse">Memuat data...</td></tr>
            ) : daftarCustomer.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 font-medium">Belum ada pelanggan.</td></tr>
            ) : (
              daftarCustomer.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{item.kontak || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{item.alamat || "-"}</td>
                  {/* KOLOM AKSI TERBARU */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors" title="Edit Data">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.nama)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors" title="Hapus Pelanggan">
                        <Trash2 size={15} />
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
  );
}