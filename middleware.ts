import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Definisikan halaman mana saja yang tidak perlu login
  const isPublic = path === '/login';
  
  // Cek apakah pengunjung punya tiket (cookie 'token')
  const token = request.cookies.get('token')?.value;

  // 1. Jika mencoba buka halaman dalam (dashboard) TAPI tidak punya tiket -> Lempar ke Login
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Jika sudah punya tiket (sudah login) TAPI mencoba buka halaman Login -> Lempar ke Dashboard
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Konfigurasi ini mengatur agar middleware mengecek SEMUA halaman (kecuali API dan file gambar/css)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};