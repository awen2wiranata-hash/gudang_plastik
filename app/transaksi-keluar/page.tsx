"use client";

import { useEffect, useState } from "react";
import Select from "react-select";

type Customer = { id: string; nama: string };
type Barang = { id: string; namaBarang: string; kodeBarang: string; stokSekarang: number };
type DetailKeluar = { barangId: string; jumlah: number | "" };
type RiwayatKeluar = {
  id: string;
  nomorNota: string;
  tanggal: string;
  customer: { nama: string };
  detailBarang: { jumlah: number; barang: { namaBarang: string } }[];
};

export default function TransaksiKeluarPage() {
  const [daftarCustomer, setDaftarCustomer] = useState<Customer[]>([]);
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [riwayatKeluar, setRiwayatKeluar] = useState<RiwayatKeluar[]>([]);
  const [loading, setLoading] = useState(true);

  const [nomorNota, setNomorNota] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [keranjang, setKeranjang] = useState<DetailKeluar[]>([{ barangId: "", jumlah: 1 }]);

  const fetchData = async () => {
    try {
      const [resCus, resBar, resRiw] = await Promise.all([
        fetch("/api/customer"),
        fetch("/api/barang"),
        fetch("/api/transaksi-keluar")
      ]);

      const dataCus = await resCus.json();
      const dataBar = await resBar.json();
      const dataRiw = await resRiw.json();

      if (Array.isArray(dataCus)) setDaftarCustomer(dataCus);
      if (Array.isArray(dataBar)) setDaftarBarang(dataBar);
      if (Array.isArray(dataRiw)) setRiwayatKeluar(dataRiw);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const opsiCustomer = daftarCustomer.map((cus) => ({ value: cus.id, label: cus.nama }));
  const opsiBarang = daftarBarang.map((brg) => ({
    value: brg.id,
    label: `[${brg.kodeBarang}] ${brg.namaBarang} (Tersedia: ${brg.stokSekarang})`,
    stok: brg.stokSekarang
  }));

  const tambahBaris = () => setKeranjang([...keranjang, { barangId: "", jumlah: 1 }]);
  const hapusBaris = (index: number) => {
    const isiBaru = [...keranjang];
    isiBaru.splice(index, 1);
    setKeranjang(isiBaru);
  };
  const ubahKeranjang = (index: number, field: keyof DetailKeluar, value: string | number) => {
    const isiBaru = [...keranjang];
    isiBaru[index] = { ...isiBaru[index], [field]: value };
    setKeranjang(isiBaru);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    for (const item of keranjang) {
      const barangTerpilih = daftarBarang.find(b => b.id === item.barangId);
      if (barangTerpilih && Number(item.jumlah) > barangTerpilih.stokSekarang) {
        return alert(`Stok ${barangTerpilih.namaBarang} tidak cukup! Tersedia: ${barangTerpilih.stokSekarang}`);
      }
    }

    try {
      const res = await fetch("/api/transaksi-keluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nomorNota, 
          customerId, 
          tanggal,
          detailBarang: keranjang.filter(k => k.barangId !== "") 
        }),
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ Penjualan Berhasil! Stok otomatis terpotong.");
        setNomorNota("");
        setCustomerId("");
        setTanggal(new Date().toISOString().split('T')[0]);
        setKeranjang([{ barangId: "", jumlah: 1 }]);
        fetchData();
      } else {
        alert("Gagal: " + result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📤 Pengiriman Barang (Penjualan)</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-red-100">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Keluar</label>
              <input type="date" required value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 h-[38px]" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Nota Penjualan</label>
              <input type="text" required value={nomorNota} onChange={(e) => setNomorNota(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 h-[38px]" placeholder="Contoh: PJL-001" />
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pelanggan / Toko</label>
              <Select 
                options={opsiCustomer} 
                value={opsiCustomer.find(opt => opt.value === customerId) || null}
                onChange={(p) => setCustomerId(p?.value || "")}
                placeholder="Cari nama pelanggan..."
                isSearchable
              />
            </div>
          </div>

          <h3 className="text-lg font-semibold mb-3 text-gray-700">Daftar Barang Keluar</h3>
          {keranjang.map((item, index) => (
            <div key={index} className="flex gap-4 mb-3 items-center">
              <div className="flex-[3]">
                <Select 
                  options={opsiBarang} 
                  value={opsiBarang.find(opt => opt.value === item.barangId) || null}
                  onChange={(p) => ubahKeranjang(index, "barangId", p?.value || "")}
                  placeholder="Cari barang plastik..."
                  isSearchable
                />
              </div>
              <div className="flex-1">
                <input type="number" min="1" required value={item.jumlah} onChange={(e) => ubahKeranjang(index, "jumlah", e.target.value ? Number(e.target.value) : "")} className="w-full border border-gray-300 rounded-md p-2 h-[38px]" placeholder="Jumlah Qty" />
              </div>
              <div className="w-10">
                {index > 0 && (
                  <button type="button" onClick={() => hapusBaris(index)} className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold p-2 h-[38px] rounded-md transition-colors">X</button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-6">
            <button type="button" onClick={tambahBaris} className="text-blue-600 font-medium border border-blue-600 py-2 px-4 rounded-md hover:bg-blue-50">+ Tambah Baris</button>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-md transition-colors shadow-sm">Simpan & Potong Stok</button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-gray-800">📋 Riwayat Penjualan</h2>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl / Nota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barang Keluar</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {riwayatKeluar.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-4 font-medium">
                  <div>{r.nomorNota}</div>
                  <div className="text-xs text-gray-500">{new Date(r.tanggal).toLocaleDateString('id-ID')}</div>
                </td>
                <td className="px-6 py-4">{r.customer?.nama || "-"}</td>
                <td className="px-6 py-4 text-sm">
                  {r.detailBarang.map((d, i) => (
                    <div key={i}>{d.barang.namaBarang} (x{d.jumlah})</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}