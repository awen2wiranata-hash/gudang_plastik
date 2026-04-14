"use client";

import { useEffect, useState } from "react";

type Customer = {
  id: string;
  nama: string;
  kontak: string | null;
  alamat: string | null;
};

export default function MasterCustomerPage() {
  const [daftarCustomer, setDaftarCustomer] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [nama, setNama] = useState("");
  const [kontak, setKontak] = useState("");
  const [alamat, setAlamat] = useState("");

  const fetchCustomer = async () => {
    try {
      const res = await fetch("/api/customer");
      const data = await res.json();
      if (Array.isArray(data)) setDaftarCustomer(data);
      else setDaftarCustomer([]);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, kontak, alamat }),
      });

      if (res.ok) {
        setNama("");
        setKontak("");
        setAlamat("");
        fetchCustomer();
        alert("Pelanggan/Toko berhasil ditambahkan!");
      }
    } catch (error) {
      console.error("Gagal menambah pelanggan", error);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">👥 Master Pelanggan / Toko</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Tambah Pelanggan Baru</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex-[2]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko / Pelanggan</label>
              <input type="text" required value={nama} onChange={(e) => setNama(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Toko Berkah Plastik" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
              <input type="text" value={kontak} onChange={(e) => setKontak(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: 0812..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Pengiriman</label>
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: Pasar Tengah Blok A" />
          </div>
          <button type="submit" className="self-end bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors">
            Simpan Pelanggan
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko/Pelanggan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kontak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alamat</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="text-center py-4">Memuat data...</td></tr>
            ) : daftarCustomer.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-4 text-gray-500">Belum ada pelanggan.</td></tr>
            ) : (
              daftarCustomer.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.kontak || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.alamat || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}