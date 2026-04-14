import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

// Pengaturan judul website di tab browser
export const metadata: Metadata = {
  title: "Family Jaya | Gudang",
  description: "Sistem Manajemen Inventori dan Peramalan SMA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <div className="flex h-screen overflow-hidden">
          
          {/* SIDEBAR (Menu Kiri) */}
          <aside className="w-64 bg-slate-800 text-white flex flex-col shadow-xl z-20">
            {/* Logo / Nama Toko */}
            <div className="p-6 border-b border-slate-700 bg-slate-900">
              <h1 className="text-2xl font-extrabold tracking-wider text-blue-400">FAMILY JAYA</h1>
              <p className="text-xs text-slate-400 mt-1">Sistem Inventori & SMA</p>
            </div>
            
            {/* Daftar Menu */}
            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-3">
                <li className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-2 px-3">
                  Master Data
                </li>
                <li>
                  <Link href="/barang" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors">
                    📦 Master Barang
                  </Link>
                </li>
                <li>
                  <Link href="/supplier" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors">
                    🏢 Master Pemasok
                  </Link>
                </li>
                <li>
                  <Link href="/customer" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors">
                    👥 Master Pelanggan
                  </Link>
                </li>
                
                <li className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">
                  Transaksi Gudang
                </li>
                <li>
                  <Link href="/transaksi-masuk" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-emerald-400">
                    📥 Barang Masuk
                  </Link>
                </li>
                <li>
                  <Link href="/transaksi-keluar" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-rose-400">
                    📤 Barang Keluar (Penjualan)
                  </Link>
                </li>
                
                <li className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 px-3">
                  Analitik Skripsi
                </li>
                <li>
                  <Link href="/peramalan" className="block px-3 py-2 rounded-md hover:bg-slate-700 transition-colors text-blue-300">
                    📈 Peramalan SMA
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* MAIN CONTENT AREA (Area Konten Kanan) */}
          <div className="flex-1 flex flex-col relative">
            
            {/* TOP NAVBAR (Header Atas) */}
            <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 z-10 border-b border-gray-200">
              <div className="text-lg font-semibold text-gray-700">
                Aplikasi Gudang Plastik
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-700">Wendy Wiranata</div>
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                  </div>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-blue-200">
                  W
                </div>
              </div>
            </header>

            {/* DYNAMIC PAGE CONTENT (Isi Halaman Berubah-ubah di sini) */}
            <main className="flex-1 overflow-y-auto relative">
              {children}
            </main>
            
          </div>
        </div>
      </body>
    </html>
  );
}