import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🛠️ NAMA FUNGSI DIUBAH MENJADI "proxy" AGAR DIKENALI NEXT.JS 16
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Loloskan aset static, folder internal Next.js, dan API tanpa filter
  if (
    path.startsWith('/_next') || 
    path.startsWith('/api') || 
    path.includes('.') || 
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  // Jika tidak punya token dan ingin masuk ke halaman dalam -> Tendang ke /login
  if (!token && path !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah punya token malah buka halaman /login -> Lempar ke Dashboard (/)
  if (token && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};