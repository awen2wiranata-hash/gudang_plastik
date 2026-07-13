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

  // AMBIL DATA ROLE DARI COOKIE SAAT HALAMAN DIMUAT
  useEffect(() => {
    if (!isLoginPage) {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      
      if (tokenCookie) {
        const tokenValue = decodeURIComponent(tokenCookie.split("=")[1]);
        const parts = tokenValue.split("|");
        if (parts.length > 1) {
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

  // Fungsi pembantu pembakar kelas CSS navigasi aktif (Sidebar Active Link Highlighter)
  const getNavLinkClass = (href: string) => {
    const baseClass = "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group";
    
    // Jika rute saat ini cocok dengan href tautan, sematkan warna biru aktif
    if (pathname === href) {
      return `${baseClass} bg-blue-50 text-blue-600 font-bold shadow-sm`;
    }
    // Jika tidak aktif, gunakan warna abu-abu netral bawaan
    return `${baseClass} text-gray-600 hover:bg-gray-50 hover:text-blue-600`;
  };

  // Fungsi pembantu pengubah warna ikon navigasi secara dinamis
  const getIconClass = (href: string, defaultColorClass: string) => {
    if (pathname === href) {
      return "text-blue-600 scale-105 transition-transform";
    }
    return `${defaultColorClass} group-hover:text-blue-600 transition-colors`;
  };

  return (
    <html lang="id">
      <head>
        <title>Family Jaya | Dashboard</title>
        <meta name="description" content="Sistem Manajemen Inventori Terpadu" />
      </head>
      <body className={`${inter.className} bg-gray-50 text-gray-900 print:bg-white`}>
        
        {/* JALUR FILTER KONDISI LAYOUT */}
        {isLoginPage ? (
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        ) : (
          <div className="flex h-screen overflow-hidden print:h-auto print:block">
            
            {/* SIDEBAR ASLI */}
            <aside className="w-[260px] bg-white border-r border-gray-200 flex flex-col z-20 print:hidden">
              
              {/* Logo dan Judul */}
              <div className="h-20 flex items-center px-8 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-lg">F</span>
                  </div>
                  <h1 className="text-xl font-bold text-gray-800 tracking-tight">Family Jaya</h1>
                </Link>
              </div>
              
              <nav className="flex-1 overflow-y-auto py-6 px-4 flex flex-col justify-between">
                <div>
                  {/* MASTER DATA */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Master Data</p>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/barang" className={getNavLinkClass("/barang")}>
                          <Package size={20} className={getIconClass("/barang", "text-gray-400")} />
                          Master Barang
                        </Link>
                      </li>
                      <li>
                        <Link href="/supplier" className={getNavLinkClass("/supplier")}>
                          <Building2 size={20} className={getIconClass("/supplier", "text-gray-400")} />
                          Master Pemasok
                        </Link>
                      </li>
                      <li>
                        <Link href="/customer" className={getNavLinkClass("/customer")}>
                          <Users size={20} className={getIconClass("/customer", "text-gray-400")} />
                          Master Pelanggan
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* TRANSAKSI */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Transaksi</p>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/transaksi-masuk" className={getNavLinkClass("/transaksi-masuk")}>
                          <ArrowDownToLine size={20} className={getIconClass("/transaksi-masuk", "text-emerald-500")} />
                          Barang Masuk
                        </Link>
                      </li>
                      <li>
                        <Link href="/transaksi-keluar" className={getNavLinkClass("/transaksi-keluar")}>
                          <ArrowUpFromLine size={20} className={getIconClass("/transaksi-keluar", "text-rose-500")} />
                          Penjualan Keluar
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* ANALITIK */}
                  <div className="mb-6">
                    <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Analitik</p>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/peramalan" className={getNavLinkClass("/peramalan")}>
                          <TrendingUp size={20} className={getIconClass("/peramalan", "text-blue-600")} />
                          Peramalan SMA
                        </Link>
                      </li>
                    </ul>
                  </div>

                  {/* MENU KHUSUS OWNER */}
                  {userRole === "SUPER_ADMIN" && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <p className="px-4 text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Sistem Keamanan</p>
                      <ul className="space-y-1">
                        <li>
                          <Link href="/dashboard/audit-log" className={getNavLinkClass("/dashboard/audit-log")}>
                            <ShieldAlert size={20} className={getIconClass("/dashboard/audit-log", "text-amber-600")} />
                            CCTV Audit Log
                          </Link>
                        </li>
                        <li>
                          <Link href="/dashboard/users" className={getNavLinkClass("/dashboard/users")}>
                            <Users size={20} className={getIconClass("/dashboard/users", "text-gray-400")} />
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
                  </div>
                </div>
                <div className="flex items-center gap-6">
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