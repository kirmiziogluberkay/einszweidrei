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

const PROTECTED_ROUTES = ['/ilan-ver', '/profilim', '/mesajlar', '/admin'];
const ADMIN_ROUTE_PREFIX = '/admin';
const USER_ROLES = { ADMIN: 'admin', USER:  'user' };

/**
 * Edge middleware — her istek öncesinde çalışır.
 *
 * @param {import('next/server').NextRequest} request
 */
export async function middleware(request) {
  try {
    let response = NextResponse.next({ request });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Eğer env değişkenleri yoksa hiç işlem yapmadan devam et (500 hatasını önlemek için)
    if (!supabaseUrl || !supabaseKey) {
      console.error('Middleware Error: Supabase env variables are missing.');
      return response;
    }

    // Oturum yönetimi için Supabase oluştur
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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

    // Oturumu al
    const { data: { user }, error } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // ── Korumalı rotalar kontrolü ───────────────────────
    const isProtected = PROTECTED_ROUTES.some(
      (route) => pathname.startsWith(route)
    );

    if (isProtected && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // ── Admin rotası kontrolü ───────────────────────────
    if (pathname.startsWith(ADMIN_ROUTE_PREFIX) && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== USER_ROLES.ADMIN) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return response;
  } catch (error) {
    console.error('Middleware Unhandled Error:', error);
    // Hata çökse bile 500 vermemesi için normal response döndür
    return NextResponse.next({ request });
  }
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
