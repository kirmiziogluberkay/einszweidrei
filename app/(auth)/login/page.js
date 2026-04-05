/**
 * app/(auth)/login/page.js
 * ─────────────────────────────────────────────────────
 * Giriş sayfası.
 * Supabase Auth ile e-posta/şifre kimlik doğrulaması.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SITE_NAME } from '@/constants/config';

/** @type {import('next').Metadata} */
export const metadata = { title: 'Giriş Yap' };

export default function LoginPage() {
  const supabase    = createClient();
  const router      = useRouter();
  const searchParams = useSearchParams();

  /** Başarılı girişten sonra yönlendirilecek URL */
  const redirectTo = searchParams.get('redirect') || '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  /**
   * Giriş formunu gönderir.
   * @param {React.FormEvent} e
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    if (authError) {
      // Türkçe hata mesajı
      setError(
        authError.message === 'Invalid login credentials'
          ? 'E-posta veya şifre hatalı.'
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Logo / Başlık */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Hoş Geldiniz</h1>
          <p className="text-sm text-ink-secondary mt-1">Hesabınıza giriş yapın</p>
        </div>

        {/* Kart */}
        <div className="card p-6 sm:p-8">
          {/* Hata mesajı */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100
                            rounded-xl text-red-600 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* E-posta */}
            <div>
              <label htmlFor="login-email" className="label">E-posta</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="login-password" className="label">Şifre</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="input"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : 'Giriş Yap'}
            </button>
          </form>
        </div>

        {/* Kayıt linki */}
        <p className="text-center text-sm text-ink-secondary mt-5">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-brand-500 font-medium hover:underline">
            Kayıt Olun
          </Link>
        </p>
      </div>
    </div>
  );
}
