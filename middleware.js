import { NextResponse } from 'next/server';

export async function middleware(request) {
  // Geçici olarak middleware devre dışı bırakıldı (Vercel Edge Hatası için test)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

