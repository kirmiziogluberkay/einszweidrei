/**
 * app/(auth)/login/page.js
 * ─────────────────────────────────────────────────────
 * Login page.
 * Email/password authentication with Supabase Auth.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SITE_NAME } from '@/constants/config';


// Metadata cannot be exported from 'use client' files.

import { Suspense } from 'react';

function LoginContent() {
  const supabase    = createClient();
  const router      = useRouter();
  const searchParams = useSearchParams();

  /** Redirect URL after successful login — only internal paths are allowed */
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  /**
   * Submits the login form.
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
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
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

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Welcome</h1>
          <p className="text-sm text-ink-secondary mt-1">Log in to your account</p>
        </div>

        {/* Card */}
        <div className="card p-6 sm:p-8">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100
                            rounded-xl text-red-600 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sample@mail.com"
                required
                autoComplete="email"
                className="input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="label">Password</label>
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              id="login-submit-btn"
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : 'Log In'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-ink-secondary mt-5">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-500 font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
