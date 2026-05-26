"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2, X, Check } from "lucide-react";

type Supplier = {
  id: string;
  namaPabrik: string;
  kontak: string | null;
  alamat: string | null;
};

export default function MasterSupplierPage() {
  const [daftarSupplier, setDaftarSupplier] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State untuk Tambah/Edit
  const [namaPabrik, setNamaPabrik] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");
  
  // State Pembantu Pengontrol Mode Edit
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSupplier = async () => {
    try {
      const res = await fetch("/api/supplier");
      const data = await res.json();
      if (Array.isArray(data)) setDaftarSupplier(data);
      else setDaftarSupplier([]);
    } catch (error) {
      console.error("Gagal mengambil data", error);
      setDaftarSupplier([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = "/api/supplier";
      const method = editingId ? "PUT" : "POST";
      const bodyData = editingId 
        ? { id: editingId, namaPabrik, kontak, alamat } 
        : { namaPabrik, kontak, alamat };

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        setNamaPabrik("");
        setKontak("");
        setAlamat("");
        setEditingId(null);
        fetchSupplier();
        alert(editingId ? "Data pabrik berhasil diperbarui!" : "Pabrik / Pemasok berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Gagal memproses data supplier", error);
    }
  };

  const handleEditClick = (item: Supplier) => {
    setEditingId(item.id);
    setNamaPabrik(item.namaPabrik);
    setKontak(item.kontak || "");
    setAlamat(item.alamat || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNamaPabrik("");
    setKontak("");
    setAlamat("");
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pemasok [${nama}]?\nTindakan ini akan memicu pencatatan Audit Log.`)) {
      try {
        const res = await fetch(`/api/supplier?id=${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchSupplier();
          alert("Pemasok berhasil dihapus dari sistem!");
        } else {
          const err = await res.json();
          alert(err.error || "Gagal menghapus data");
        }
      } catch (error) {
        console.error("Gagal menghapus supplier", error);
      }
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">🏢 Master Pemasok / Pabrik</h1>

      {/* Form Card Dinamis */}
      <div className={`p-6 rounded-xl shadow-sm mb-8 border transition-all ${editingId ? "bg-amber-50/50 border-amber-200" : "bg-white border-gray-200"}`}>
        <h2 className="text-xl font-bold mb-4 text-gray-700 flex items-center gap-2">
          {editingId ? "🛠️ Mode Edit Data Pemasok" : "Tambah Pemasok Baru"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[2]">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nama Pabrik / Pemasok</label>
              <input type="text" required value={namaPabrik} onChange={(e) => setNamaPabrik(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: Pabrik Bintang Terang" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-600 mb-1">Nomor Telepon</label>
              <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: 08123456789" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Alamat Pemasok</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none focus:border-blue-500" placeholder="Contoh: Jl. Sudirman No. 12" />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-5 rounded-xl text-sm transition-colors">
                <X size={16} /> Batal
              </button>
            )}
            <button type="submit" className={`inline-flex items-center gap-1 font-bold py-2 px-6 rounded-xl text-sm text-white transition-colors shadow-sm ${editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              {editingId ? <Check size={16} /> : null}
              {editingId ? "Simpan Perubahan" : "Simpan Pemasok"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Data Lengkap */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 font-semibold">
            <tr>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Nama Pabrik/Pemasok</th>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Kontak</th>
              <th className="px-6 py-4 text-left text-xs text-gray-500 uppercase tracking-wider">Alamat</th>
              <th className="px-6 py-4 text-center text-xs text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 font-medium animate-pulse">Memuat data...</td></tr>
            ) : daftarSupplier.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 font-medium">Belum ada pemasok. Silakan tambah di atas!</td></tr>
            ) : (
              daftarSupplier.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{item.namaPabrik}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{item.kontak || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">{item.alamat || "-"}</td>
                  {/* KOLOM AKSI TERBARU */}
                  <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors" title="Edit Data">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.namaPabrik)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors" title="Hapus Permanen">
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