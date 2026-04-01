"use client";

import { useEffect, useState } from "react";
import Select from "react-select"; // <--- Mengimpor fitur Search Bar

type Supplier = { id: string; namaPabrik: string };
type Barang = { id: string; namaBarang: string; kodeBarang: string; stokSekarang: number };
type DetailMasuk = { barangId: string; jumlah: number | "" };
type RiwayatMasuk = {
  id: string;
  nomorNota: string;
  tanggal: string;
  supplier: { namaPabrik: string };
  detailBarang: { jumlah: number; barang: { namaBarang: string } }[];
};

export default function TransaksiMasukPage() {
  const [daftarSupplier, setDaftarSupplier] = useState<Supplier[]>([]);
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [riwayatMasuk, setRiwayatMasuk] = useState<RiwayatMasuk[]>([]);
  const [loading, setLoading] = useState(true);

  const [nomorNota, setNomorNota] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [keranjang, setKeranjang] = useState<DetailMasuk[]>([{ barangId: "", jumlah: 1 }]);

  const fetchData = async () => {
    try {
      const [resSup, resBar, resRiw] = await Promise.all([
        fetch("/api/supplier"),
        fetch("/api/barang"),
        fetch("/api/transaksi-masuk")
      ]);

      const dataSup = await resSup.json();
      const dataBar = await resBar.json();
      const dataRiw = await resRiw.json();

      if (Array.isArray(dataSup)) setDaftarSupplier(dataSup);
      if (Array.isArray(dataBar)) setDaftarBarang(dataBar);
      if (Array.isArray(dataRiw)) setRiwayatMasuk(dataRiw);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format data untuk fitur Search Bar (React-Select)
  const opsiSupplier = daftarSupplier.map((sup) => ({
    value: sup.id,
    label: sup.namaPabrik
  }));

  const opsiBarang = daftarBarang.map((brg) => ({
    value: brg.id,
    label: `[${brg.kodeBarang}] ${brg.namaBarang} (Stok: ${brg.stokSekarang})`
  }));

  const tambahBaris = () => setKeranjang([...keranjang, { barangId: "", jumlah: 1 }]);
  
  const hapusBaris = (index: number) => {
    const isiBaru = [...keranjang];
    isiBaru.splice(index, 1);
    setKeranjang(isiBaru);
  };
  
  const ubahKeranjang = (index: number, field: keyof DetailMasuk, value: string | number) => {
    const isiBaru = [...keranjang];
    isiBaru[index] = { ...isiBaru[index], [field]: value };
    setKeranjang(isiBaru);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const barangValid = keranjang.filter(k => k.barangId !== "" && Number(k.jumlah) > 0);
    if (barangValid.length === 0) return alert("Pilih minimal 1 barang plastik dengan jumlah lebih dari 0!");
    if (!supplierId) return alert("Pilih pabrik/pemasok terlebih dahulu!");

    try {
      const res = await fetch("/api/transaksi-masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomorNota,
          supplierId,
          detailBarang: barangValid
        }),
      });

      if (res.ok) {
        alert("✅ Transaksi Berhasil! Stok barang otomatis bertambah.");
        setNomorNota("");
        setSupplierId("");
        setKeranjang([{ barangId: "", jumlah: 1 }]);
        fetchData();
      } else {
        alert("Gagal menyimpan transaksi.");
      }
    } catch (error) {
      console.error("Error submit:", error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📥 Penerimaan Barang (Stok Masuk)</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
        <form onSubmit={handleSubmit}>
          {/* Header Nota */}
          <div className="flex gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Nota / Surat Jalan</label>
              <input type="text" required value={nomorNota} onChange={(e) => setNomorNota(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Contoh: INV-PABRIK-001" />
            </div>
            <div className="flex-[2]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Pemasok / Pabrik</label>
              {/* Search Bar Supplier */}
              <Select 
                options={opsiSupplier}
                value={opsiSupplier.find(opt => opt.value === supplierId) || null}
                onChange={(pilihan) => setSupplierId(pilihan?.value || "")}
                placeholder="Ketik nama pabrik / pemasok..."
                isSearchable
                noOptionsMessage={() => "Pabrik tidak ditemukan"}
              />
            </div>
          </div>

          {/* Detail Barang (Keranjang) */}
          <h3 className="text-lg font-semibold mb-3 text-gray-700">Daftar Barang Datang</h3>
          {keranjang.map((item, index) => (
            <div key={index} className="flex gap-4 mb-3 items-center">
              <div className="flex-[3]">
                <label className="block text-xs text-gray-500 mb-1">Cari Barang Plastik</label>
                {/* Search Bar Barang */}
                <Select 
                  options={opsiBarang}
                  value={opsiBarang.find(opt => opt.value === item.barangId) || null}
                  onChange={(pilihan) => ubahKeranjang(index, "barangId", pilihan?.value || "")}
                  placeholder="Ketik nama / kode barang plastik..."
                  isSearchable
                  noOptionsMessage={() => "Barang plastik tidak ditemukan"}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Jumlah Masuk</label>
                <input 
                  type="number" 
                  min="1" 
                  required 
                  value={item.jumlah} 
                  onChange={(e) => ubahKeranjang(index, "jumlah", e.target.value ? Number(e.target.value) : "")} 
                  className="w-full border border-gray-300 rounded-md p-2 h-[38px]" 
                />
              </div>
              <div className="w-10 pt-5">
                {index > 0 && (
                  <button type="button" onClick={() => hapusBaris(index)} className="w-full bg-red-100 hover:bg-red-200 text-red-600 font-bold p-2 h-[38px] rounded-md transition-colors" title="Hapus Baris">
                    X
                  </button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-between mt-6">
            <button type="button" onClick={tambahBaris} className="text-blue-600 border border-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-md transition-colors">
              + Tambah Baris Barang
            </button>
            <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-8 rounded-md transition-colors shadow-sm">
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Riwayat */}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📋 Riwayat Penerimaan</h2>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl / Nota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pemasok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rincian Barang</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={3} className="text-center py-4">Memuat data...</td></tr>
            ) : riwayatMasuk.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-4 text-gray-500">Belum ada riwayat transaksi masuk.</td></tr>
            ) : (
              riwayatMasuk.map((riwayat) => (
                <tr key={riwayat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{riwayat.nomorNota}</div>
                    <div className="text-xs text-gray-500">{new Date(riwayat.tanggal).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{riwayat.supplier?.namaPabrik || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <ul className="list-disc pl-4">
                      {riwayat.detailBarang.map((det, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{det.barang.namaBarang}</span> : +{det.jumlah} qty
                        </li>
                      ))}
                    </ul>
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