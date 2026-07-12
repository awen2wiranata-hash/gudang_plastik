import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🛠️ SEKARANG MENGGUNAKAN NAMA FUNGSI "proxy" SESUAI STANDAR NEXT.JS 16
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Loloskan aset static, folder internal Next.js, dan API tanpa filter
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.includes('.') || 
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // ========================================================
  // [PROSES 1: OTENTIKASI] - Cek Status Login
  // ========================================================
  
  // Jika tidak punya token dan ingin masuk ke halaman dalam -> Tendang ke /login
  if (!token && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah punya token malah membuka halaman /login -> Lempar ke Halaman Utama (/)
  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ========================================================
  // [PROSES 2: OTORISASI / RBAC] - Pengunci URL untuk Next.js 16
  // ========================================================
  if (token) {
    // Ekstrak string role dari token cookie kamu (Format: nilai|ROLE)
    const tokenValue = decodeURIComponent(token);
    const parts = tokenValue.split("|");
    const userRole = parts.length > 1 ? parts[1] : "ADMIN";

    // Daftar rute-rute sensitif yang HANYA boleh dibuka oleh SUPER_ADMIN (Owner)
    const ruteKhususOwner = ['/dashboard/audit-log', '/dashboard/users'];

    // Cek apakah URL yang sedang diketik manual oleh staf termasuk rute terlarang
    const sedangAksesRuteRahasia = ruteKhususOwner.some(rute => path.startsWith(rute));

    // Proteksi: Jika mencoba mengakses rute rahasia tapi role-nya BUKAN SUPER_ADMIN
    if (sedangAksesRuteRahasia && userRole !== 'SUPER_ADMIN') {
      // Usir secara paksa dan alihkan ke halaman Master Barang yang aman
      return NextResponse.redirect(new URL('/barang', request.url));
    }
  }

  return NextResponse.next();
}

// Menentukan rute mana saja yang akan diawasi oleh sistem proxy ini
export const config = {
  matcher: ['/:path*'],
};