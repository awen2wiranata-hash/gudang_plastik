"use client";

import { useEffect, useState } from "react";
import Select from "react-select";

type Barang = { id: string; namaBarang: string; kodeBarang: string };
type RiwayatPeramalan = {
  id: string;
  tanggalAwal: string;
  tanggalAkhir: string;
  nilaiSMA: number;
  barang: { namaBarang: string; kodeBarang: string };
};

export default function PeramalanPage() {
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatPeramalan[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [barangId, setBarangId] = useState("");
  const [tanggalAwal, setTanggalAwal] = useState("");
  const [tanggalAkhir, setTanggalAkhir] = useState("");
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [p3, setP3] = useState("");

  const fetchData = async () => {
    try {
      const [resBar, resRiw] = await Promise.all([
        fetch("/api/barang"),
        fetch("/api/peramalan")
      ]);
      const dataBar = await resBar.json();
      const dataRiw = await resRiw.json();

      if (Array.isArray(dataBar)) setDaftarBarang(dataBar);
      if (Array.isArray(dataRiw)) setRiwayat(dataRiw);
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const opsiBarang = daftarBarang.map((brg) => ({
    value: brg.id,
    label: `[${brg.kodeBarang}] ${brg.namaBarang}`
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangId) return alert("Pilih barang terlebih dahulu!");

    try {
      const res = await fetch("/api/peramalan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          barangId, 
          tanggalAwal, 
          tanggalAkhir, 
          periode1: p1, 
          periode2: p2, 
          periode3: p3 
        }),
      });

      if (res.ok) {
        alert("✅ Perhitungan SMA Berhasil Disimpan!");
        setBarangId("");
        setTanggalAwal("");
        setTanggalAkhir("");
        setP1(""); setP2(""); setP3("");
        fetchData();
      } else {
        alert("Gagal menghitung peramalan.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">📈 Analitik Peramalan SMA</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-blue-100">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Kalkulator Simple Moving Average (3 Periode)</h2>
        <form onSubmit={handleSubmit}>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang Plastik Target</label>
            <Select 
              options={opsiBarang} 
              value={opsiBarang.find(opt => opt.value === barangId) || null}
              onChange={(p) => setBarangId(p?.value || "")}
              placeholder="Cari barang untuk diramal..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Tgl Mulai Ramalan</label>
              <input type="date" required value={tanggalAwal} onChange={(e) => setTanggalAwal(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Tgl Akhir Ramalan</label>
              <input type="date" required value={tanggalAkhir} onChange={(e) => setTanggalAkhir(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Masukkan Data Penjualan Masa Lalu (Input Demand)</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Bulan/Minggu ke-1 (Terlama)</label>
                <input type="number" min="0" required value={p1} onChange={(e) => setP1(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Qty" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Bulan/Minggu ke-2</label>
                <input type="number" min="0" required value={p2} onChange={(e) => setP2(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Qty" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Bulan/Minggu ke-3 (Terbaru)</label>
                <input type="number" min="0" required value={p3} onChange={(e) => setP3(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Qty" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-md transition-colors shadow-sm text-lg">
              Hitung Prediksi & Simpan
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-gray-800">📋 Laporan Hasil Peramalan</h2>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Barang</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Periode Target</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase">Prediksi Permintaan (SMA)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {riwayat.map((r) => (
              <tr key={r.id}>
                <td className="px-6 py-4 font-medium text-gray-900">
                  [{r.barang.kodeBarang}] {r.barang.namaBarang}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(r.tanggalAwal).toLocaleDateString('id-ID')} s/d {new Date(r.tanggalAkhir).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-blue-100 text-blue-800 py-1 px-4 rounded-full font-bold text-lg shadow-sm border border-blue-200">
                    {r.nilaiSMA} unit
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}