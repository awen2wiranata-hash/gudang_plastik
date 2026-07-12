import { Package, Users, Truck, AlertTriangle, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; 

export default async function DashboardPage() {
  const totalBarang = await prisma.barang.count({
    where: { isAktif: true }
  });
  const totalPemasok = await prisma.supplier.count();
  const totalCustomer = await prisma.customer.count();
  
  const stokKritisCount = await prisma.barang.count({
    where: { 
      stokSekarang: { lt: 10 },
      isAktif: true
    }
  });

  const barangKritis = await prisma.barang.findMany({
    where: { 
      stokSekarang: { lt: 10 },
      isAktif: true
    },
    take: 5, 
    orderBy: { stokSekarang: 'asc' } 
  });

  const transaksiTerbaru = await prisma.transaksiKeluar.findMany({
    take: 5,
    orderBy: { tanggal: 'desc' },
    include: { 
      customer: true, 
    }
  });

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di Sistem Informasi Manajemen Gudang Family Jaya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Barang Aktif</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalBarang} <span className="text-sm font-normal text-gray-400">Item</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pemasok</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalPemasok}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Customer</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalCustomer}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
          <div className="p-4 bg-red-100 text-red-600 rounded-xl animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-red-600">Stok Kritis {"(<10)"}</p>
            <h3 className="text-2xl font-bold text-gray-900">{stokKritisCount} <span className="text-sm font-normal text-gray-500">Barang</span></h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" />
              Barang Keluar Terbaru
            </h2>
            <Link href="/transaksi-keluar" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">No. Nota</th>
                  <th className="px-6 py-4">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transaksiTerbaru.length > 0 ? (
                  transaksiTerbaru.map((trx) => (
                    <tr key={trx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {new Date(trx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{trx.nomorNota}</td>
                      <td className="px-6 py-4">{trx.customer.nama}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-400">
                      Belum ada data transaksi keluar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Butuh Restok Segera
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {barangKritis.length > 0 ? (
              barangKritis.map((barang) => (
                <div key={barang.id} className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{barang.namaBarang}</h4>
                    <p className="text-xs text-gray-500 mt-1">Kode: {barang.kodeBarang}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-red-600 font-bold mb-1">Stok Sisa</p>
                    <span className="font-extrabold text-red-700 text-lg">{barang.stokSekarang}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 text-sm">
                🎉 Hebat! Tidak ada barang yang stoknya kritis.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}