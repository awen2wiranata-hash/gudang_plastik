"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Ambil data token lewat cara aman di Client Side karena middleware mati
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookie("token");

    if (!token) {
      router.push("/login");
    } else {
      const [_, role] = decodeURIComponent(token).split("|");
      setUserRole(role);
      setLoading(false);
    }
  }, [router]);

  // Fungsi Pembersih Token saat Tombol Keluar diklik
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-bold">
        Memuat Data Autentikasi Gudang...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-800">
      {/* Header Dashboard */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Gudang Family Jaya</h1>
          <p className="text-sm text-gray-500 font-medium">
            Anda masuk sebagai: <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-xs">{userRole}</span>
          </p>
        </div>
        
        {/* Tombol diganti menggunakan button dengan fungsi handleLogout */}
        <button 
          onClick={handleLogout} 
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all shadow"
        >
          Keluar Aplikasi
        </button>
      </div>

      {/* GRID MENU UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-700 mb-1">📦 Stok Barang</h3>
          <p className="text-xs text-gray-400 mb-4">Melihat sisa stok plastik aktual di rak gudang.</p>
          <button className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">Buka Tabel Stok</button>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-lg text-gray-700 mb-1">🔄 Transaksi Harian</h3>
          <p className="text-xs text-gray-400 mb-4">Input nota barang masuk dan barang keluar.</p>
          <button className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">Mulai Input</button>
        </div>

        <div className="bg-purple-50 p-5 rounded-2xl shadow-sm border border-purple-200">
          <h3 className="font-bold text-lg text-purple-900 mb-1">📈 Peramalan (SMA)</h3>
          <p className="text-xs text-purple-500 mb-4">Prediksi hitungan matematika stok untuk minggu depan.</p>
          <button className="w-full bg-purple-600 text-white text-xs font-bold py-2 rounded-lg">Lihat Grafik SMA</button>
        </div>

        <div className="bg-amber-50 p-5 rounded-2xl shadow-sm border border-amber-200">
          <h3 className="font-bold text-lg text-amber-900 mb-1">🚨 Peringatan ROP</h3>
          <p className="text-xs text-amber-500 mb-4">Alarm batas kritis untuk pemesanan kembali ke pabrik.</p>
          <button className="w-full bg-amber-600 text-white text-xs font-bold py-2 rounded-lg">Cek Batas ROP</button>
        </div>
      </div>

      {/* TABEL RIWAYAT ANTI-FRAUD */}
      <div className="mt-8 bg-white border rounded-xl p-4">
        <h2 className="font-bold mb-4">Riwayat Nota Terakhir</h2>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50"><th className="p-2">No Nota</th><th className="p-2">Aksi</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">NOTA-2026-001</td>
              <td className="p-2 space-x-2">
                <button className="text-blue-600 font-medium">👁️ Buka</button>
                {userRole === "SUPER_ADMIN" && (
                  <button className="text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                    🗑️ Hapus (Rollback Stok)
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}