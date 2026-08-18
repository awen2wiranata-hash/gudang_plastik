"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Image as ImageIcon, Upload, Trash2 } from "lucide-react";

// 🛠️ TAMBAHAN: Buat Tipe Data (Interface) untuk mendeskripsikan struktur data dari API
interface ChartData {
  name: string;
  terjual: number;
}

interface Statistik {
  stokFisik: number;
  sma: number;
  rop: number;
  mape: number;
  statusPeringatan: string;
}

interface DetailBarang {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: string | null;
  isAktif: boolean;
  gambarUrl: string | null;
  chartData: ChartData[];
  statistik: Statistik;
  error?: string;
}

export default function DetailBarangPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // 🛠️ PERBAIKAN: Ganti <any> menjadi <DetailBarang | null>
  const [data, setData] = useState<DetailBarang | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await fetch(`/api/barang/${id}`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Gagal fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUploadGambar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran gambar terlalu besar! Maksimal 2MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64String = reader.result;
      
      try {
        const res = await fetch(`/api/barang/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gambarUrl: base64String })
        });
        
        if(res.ok) {
          alert("Gambar berhasil diupload!");
          fetchDetail();
        }
      } catch (err) {
        alert("Gagal mengupload gambar.");
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    };
  };

  const handleHapusGambar = async () => {
    if(confirm("Yakin ingin menghapus gambar ini?")) {
      await fetch(`/api/barang/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gambarUrl: null })
      });
      fetchDetail();
    }
  };

  if (loading) return <div className="p-8 text-center text-xl font-bold text-gray-500">Memuat detail dan menghitung peramalan...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500 font-bold">Data barang tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full bg-gray-50 min-h-screen">
     <button 
  onClick={() => {
    router.refresh(); // 🛠️ PERBAIKAN 2A: Beri tahu Next.js untuk me-refresh data server
    router.push('/barang'); // 🛠️ PERBAIKAN 2B: Arahkan ke rute tabel barang secara eksplisit
  }} 
  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold mb-6 transition-colors"
>
        <ArrowLeft className="w-5 h-5" /> Kembali ke Daftar Barang
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Detail: {data.namaBarang}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ================= KOLOM KIRI: INFO & GAMBAR ================= */}
        <div className="flex flex-col gap-6">
          
          {/* Card Foto */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
            <h2 className="w-full text-left font-bold text-gray-700 mb-4 border-b pb-2">Foto Barang</h2>
            
            <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-4 relative">
              {data.gambarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.gambarUrl} alt={data.namaBarang} className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-sm font-medium">Belum ada foto</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full">
              <label className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 py-2 rounded-lg font-bold text-sm cursor-pointer transition-colors text-center flex justify-center items-center gap-2">
                <Upload className="w-4 h-4" /> {isUploading ? "..." : (data.gambarUrl ? "Ganti Foto" : "Upload Foto")}
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadGambar} disabled={isUploading} />
              </label>
              {data.gambarUrl && (
                <button onClick={handleHapusGambar} className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 p-2 rounded-lg transition-colors" title="Hapus Foto">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Card Informasi Dasar */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-700 mb-4 border-b pb-2">Informasi Sistem</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">Kode Barang</span>
                <span className="font-bold text-gray-900">{data.kodeBarang}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">Kategori</span>
                <span className="font-bold text-gray-900">{data.kategori || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-gray-500 font-medium">Status Katalog</span>
                <span className={`font-bold ${data.isAktif ? 'text-green-600' : 'text-red-600'}`}>
                  {data.isAktif ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500 font-medium">Status Restock</span>
                <span className={`font-black px-2 py-0.5 rounded ${data.statistik?.statusPeringatan === 'AMAN' || data.statistik?.statusPeringatan === 'AMAN ✅' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {data.statistik?.statusPeringatan}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= KOLOM KANAN: STATISTIK & GRAFIK ================= */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* 4 Card Statistik Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-b-4 border-b-blue-500 flex flex-col justify-center items-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">Stok Fisik</p>
              <h3 className="text-2xl font-black text-gray-800">{data.statistik?.stokFisik}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-b-4 border-b-amber-500 flex flex-col justify-center items-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">Ramalan (SMA-5)</p>
              <h3 className="text-2xl font-black text-gray-800">{data.statistik?.sma}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-b-4 border-b-red-500 flex flex-col justify-center items-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">Titik Pesan (ROP)</p>
              <h3 className="text-2xl font-black text-gray-800">{data.statistik?.rop}</h3>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-b-4 border-b-emerald-500 flex flex-col justify-center items-center text-center">
              <p className="text-xs font-bold text-gray-500 mb-1">Error (MAPE)</p>
              <h3 className="text-2xl font-black text-gray-800">{data.statistik?.mape}%</h3>
            </div>
          </div>

          {/* Card Grafik */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="font-bold text-gray-700 mb-6 border-b pb-2">Grafik Penjualan Aktual (5 Minggu Terakhir)</h2>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`${value} Pcs`, 'Terjual']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="terjual" 
                    stroke="#3b82f6" 
                    strokeWidth={4} 
                    activeDot={{ r: 8, fill: "#1d4ed8" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}