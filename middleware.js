/**
 * middleware.js
 * ─────────────────────────────────────────────────────
 * Next.js Edge Middleware.
 * - Korumalı rotalara yetkisiz erişimi engeller.
 * - Admin rotalarını role göre korur.
 * - Supabase oturum yenilemeyi yönetir.
 * ─────────────────────────────────────────────────────
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { PROTECTED_ROUTES, ADMIN_ROUTE_PREFIX, USER_ROLES } from './constants/config';

/**
 * Edge middleware — her istek öncesinde çalışır.
 *
 * @param {import('next/server').NextRequest} request
 */
export async function middleware(request) {
  let response = NextResponse.next({ request });

  // Oturum yönetimi için Supabase oluştur
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Oturumu al (cookie'den)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Korumalı rotalar kontrolü ───────────────────────
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname.startsWith(route)
  );

  if (isProtected && !user) {
    // Giriş yapmamış kullanıcıyı login'e yönlendir
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin rotası kontrolü ───────────────────────────
  if (pathname.startsWith(ADMIN_ROUTE_PREFIX) && user) {
    // Kullanıcı rolünü veritabanından kontrol et
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== USER_ROLES.ADMIN) {
      // Admin değilse anasayfaya yönlendir
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

/** Middleware'in hangi rotalarda çalışacağını belirtir */
export const config = {
  matcher: [
    /*
     * Aşağıdaki rotaları atla:
     * - _next/static  → Statik dosyalar
     * - _next/image   → Görsel optimizasyonu
     * - favicon.ico   → Favicon
     * - /api/         → API rotaları (isteğe göre değiştir)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
