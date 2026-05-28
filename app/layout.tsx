"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation"; 
import { useEffect, useState } from "react"; 
import { 
  Package, Building2, Users, ArrowDownToLine, ArrowUpFromLine, 
  TrendingUp, Search, Bell, ChevronDown, LogOut, ShieldAlert 
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname(); 
  const [userRole, setUserRole] = useState<string>("ADMIN"); 

  // Cek apakah pengguna sedang membuka halaman login
  const isLoginPage = pathname === "/login";

  // 🛠️ AMBIL DATA ROLE DARI COOKIE SAAT HALAMAN DIMUAT (VERSI AMAN DARI CASCADING RENDER)
  useEffect(() => {
    if (!isLoginPage) {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      
      if (tokenCookie) {
        const tokenValue = decodeURIComponent(tokenCookie.split("=")[1]);
        const parts = tokenValue.split("|");
        if (parts.length > 1) {
          // 🛡️ Membungkus dengan requestAnimationFrame untuk menghindari penumpukan render
          requestAnimationFrame(() => {
            setUserRole(parts[1]);
          });
        }
      }
    }
  }, [pathname, isLoginPage]);

  const handleLogout = async () => {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <html lang="id">
      <head>
        <title>Family Jaya | Dashboard</title>
        <meta name="description" content="Sistem Manajemen Inventori Terpadu" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 print:bg-white`}>
        
        {/* 🔑 JALUR FILTER KONDISI LAYOUT */}
        {isLoginPage ? (
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        ) : (
          <div className="flex h-screen overflow-hidden print:h-auto print:block">
            
            {/* SIDEBAR ASLI */}
            <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col z-20 print:hidden">
              <div className="h-20 flex items-center px-8 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 tracking-tight">Family Jaya</h1>
                </div>
              </div>
              
              <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col justify-between">
                <div>
                  {/* MASTER DATA */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Master Data</p>
                    <ul className="space-y-1">
                      <li><Link href="/barang" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"><Package size={20} className="text-gray-400 group-hover:text-blue-600" />Master Barang</Link></li>
                      <li><Link href="/supplier" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"><Building2 size={20} className="text-gray-400 group-hover:text-blue-600" />Master Pemasok</Link></li>
                      <li><Link href="/customer" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"><Users size={20} className="text-gray-400 group-hover:text-blue-600" />Master Pelanggan</Link></li>
                    </ul>
                  </div>

                  {/* TRANSAKSI */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Transaksi</p>
                    <ul className="space-y-1">
                      <li><Link href="/transaksi-masuk" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"><ArrowDownToLine size={20} className="text-emerald-500" />Barang Masuk</Link></li>
                      <li><Link href="/transaksi-keluar" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"><ArrowUpFromLine size={20} className="text-rose-500" />Penjualan Keluar</Link></li>
                    </ul>
                  </div>

                  {/* ANALITIK */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Analitik</p>
                    <ul className="space-y-1">
                      <li><Link href="/peramalan" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-blue-700 bg-blue-50 transition-colors"><TrendingUp size={20} className="text-blue-600" />Peramalan SMA</Link></li>
                    </ul>
                  </div>

                  {/* ======================================================= */}
                  {/* 🔒 🛡️ MENU KHUSUS OWNER: HANYA TAMPIL UNTUK SUPER_ADMIN */}
                  {/* ======================================================= */}
                  {userRole === "SUPER_ADMIN" && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="px-4 text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Sistem Keamanan</p>
                      <ul className="space-y-1">
                        <li>
                          <Link 
                            href="/dashboard/audit-log" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors group"
                          >
                            <ShieldAlert size={20} className="text-amber-600 group-hover:scale-110 transition-transform" />
                            CCTV Audit Log
                          </Link>
                        </li>
                        
                        {/* 🛠️ DIUPDATE: Jalur Link disesuaikan dengan folder aplikasi aslimu */}
                        <li>
                          <Link 
                            href="/dashboard/users" 
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors group"
                          >
                            <Users size={20} className="text-gray-400 group-hover:text-blue-600" />
                            Kelola Akun Staf
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* TOMBOL LOGOUT */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
                  >
                    <LogOut size={20} className="text-red-400 group-hover:text-red-600" />
                    Keluar Sistem
                  </button>
                </div>
              </nav>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative print:block">
              
              {/* NAVBAR / HEADER ASLI */}
              <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 print:hidden">
                <div className="flex-1 max-w-md">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={18} className="text-gray-400" /></div>
                    <input type="text" className="block w-full pl-10 pr-3 py-2.5 border border-transparent rounded-full text-sm bg-gray-100 placeholder-gray-500 focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-50 transition-all" placeholder="Cari menu atau data..." />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"><Bell size={22} /><span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span></button>
                  <div className="flex items-center gap-3 pl-6 border-l border-gray-200 cursor-pointer group">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600">Wendy Wiranata</p>
                      <p className="text-xs text-gray-500 font-medium">
                        {userRole === "SUPER_ADMIN" ? "Owner System" : "Staf Gudang"}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden"><span className="font-bold text-indigo-700">W</span></div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                </div>
              </header>

              {/* PAGE CONTENT */}
              <main className="flex-1 overflow-y-auto relative bg-gray-50 print:bg-white print:overflow-visible">
                {children}
              </main>
            </div>
          </div>
        )}

      </body>
    </html>
  );
}