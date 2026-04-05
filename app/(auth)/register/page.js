/**
 * app/(auth)/register/page.js
 * ─────────────────────────────────────────────────────
 * Kayıt sayfası.
 * Kullanıcı kaydı: Supabase Auth + profiles tablosu.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SITE_NAME } from '@/constants/config';

export default function RegisterPage() {
  const supabase = createClient();
  const router   = useRouter();

  const [formData, setFormData] = useState({
    username: '',
    email:    '',
    password: '',
    confirm:  '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Kayıt formunu gönderir.
   * 1 - Supabase Auth ile kullanıcı oluştur
   * 2 - profiles tablosuna kayıt ekle
   *
   * @param {React.FormEvent} e
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Şifre eşleşme kontrolü
    if (formData.password !== formData.confirm) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    // Minimum şifre uzunluğu
    if (formData.password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      setLoading(false);
      return;
    }

    // Kullanıcı adı kontrolü (sadece harf, rakam ve alt çizgi)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      setError('Kullanıcı adı 3-30 karakter, sadece harf/rakam/alt çizgi içerebilir.');
      setLoading(false);
      return;
    }

    // Supabase Auth kaydı
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    formData.email.trim(),
      password: formData.password,
      options:  {
        data: { username: formData.username }, // Auth metadata
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Bu e-posta adresi zaten kayıtlı.'
        : authError.message);
      setLoading(false);
      return;
    }

    // profiles tablosuna ekle (trigger da ekleyebilir ama burada fallback)
    if (authData.user) {
      await supabase.from('profiles').upsert({
        id:       authData.user.id,
        username: formData.username,
        role:     'user',
      });
    }

    setSuccess(true);
    setLoading(false);

    // E-posta doğrulama gerekiyorsa başarı mesajı göster, değilse yönlendir
    setTimeout(() => router.push('/'), 2000);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-ink">Kayıt Başarılı!</h2>
          <p className="text-ink-secondary text-sm">
            Hesabınız oluşturuldu. Yönlendiriliyorsunuz...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Başlık */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Hesap Oluştur</h1>
          <p className="text-sm text-ink-secondary mt-1">Hemen ücretsiz kayıt olun</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100
                            rounded-xl text-red-600 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            {/* Kullanıcı adı */}
            <div>
              <label htmlFor="reg-username" className="label">Kullanıcı Adı</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="kullanici_adi"
                required
                autoComplete="username"
                className="input"
              />
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="reg-email" className="label">E-posta</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ornek@mail.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="reg-password" className="label">Şifre</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 karakter"
                required
                autoComplete="new-password"
                minLength={8}
                className="input"
              />
            </div>

            {/* Şifre tekrar */}
            <div>
              <label htmlFor="reg-confirm" className="label">Şifre Tekrar</label>
              <input
                id="reg-confirm"
                type="password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Şifreyi tekrar girin"
                required
                autoComplete="new-password"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              id="register-submit-btn"
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Kayıt olunuyor...</>
              ) : 'Kayıt Ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-5">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="text-brand-500 font-medium hover:underline">
            Giriş Yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
