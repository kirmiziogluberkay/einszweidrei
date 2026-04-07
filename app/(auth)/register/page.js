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
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Minimum şifre uzunluğu
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    // Kullanıcı adı kontrolü (sadece harf, rakam ve alt çizgi)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      setError('Username must be 3-30 characters, containing only letters/numbers/underscores.');
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
        ? 'This email address is already registered.'
        : authError.message);
      setLoading(false);
      return;
    }

    // profiles tablosuna ekle
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id:       authData.user.id,
        username: formData.username.toLowerCase(),
        role:     'user',
      });

      if (profileError) {
        // Eğer veritabanı hatası alırsak kullanıcıya nedeni gösterelim
        console.error("Profile creation error:", profileError);
        setError("Database Error: " + (profileError.details || profileError.message));
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/'), 2000);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-xl font-semibold text-ink">Registration Successful!</h2>
          <p className="text-ink-secondary text-sm">
            Your account has been created. Redirecting...
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
          <h1 className="text-xl font-semibold text-ink mt-3">Create Account</h1>
          <p className="text-sm text-ink-secondary mt-1">Sign up for free now</p>
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
              <label htmlFor="reg-username" className="label">Username</label>
              <input
                id="reg-username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Please write your user name"
                required
                autoComplete="username"
                className="input"
              />
            </div>

            {/* E-posta */}
            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input
                id="reg-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="sample@mail.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {/* Şifre */}
            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input
                id="reg-password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters and digit(s) and symbol(s)"
                required
                autoComplete="new-password"
                minLength={8}
                className="input"
              />
            </div>

            {/* Şifre tekrar */}
            <div>
              <label htmlFor="reg-confirm" className="label">Confirm Password</label>
              <input
                id="reg-confirm"
                type="password"
                name="confirm"
                value={formData.confirm}
                onChange={handleChange}
                placeholder="Re-enter the password"
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
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing up...</>
              ) : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 font-medium hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
