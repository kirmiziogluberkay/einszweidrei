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

// Maximum failed attempts before a temporary lockout
const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 60_000; // 1 minute

function LoginContent() {
  const supabase    = createClient();
  const router      = useRouter();
  const searchParams = useSearchParams();

  /** Redirect URL after successful login — only internal paths are allowed */
  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null); // timestamp (ms)

  /**
   * Submits the login form.
   * @param {React.FormEvent} e
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    // Lockout check
    if (lockedUntil && Date.now() < lockedUntil) {
      const secsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${secsLeft} seconds.`);
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password,
    });

    if (authError) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      // Log failed attempt to the console (server logs will capture this via SSR)
      console.warn('[Auth] Failed login attempt', {
        email: email.trim(),
        attempt: nextAttempts,
        at: new Date().toISOString(),
      });

      if (nextAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError(`Too many failed attempts. Please wait 60 seconds before trying again.`);
      } else {
        setError(
          authError.message === 'Invalid login credentials'
            ? `Invalid email or password. (${nextAttempts}/${MAX_ATTEMPTS} attempts)`
            : authError.message
        );
      }

      setLoading(false);
      return;
    }

    // Successful login — reset counters
    setAttempts(0);
    setLockedUntil(null);
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
              disabled={loading || (lockedUntil && Date.now() < lockedUntil)}
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
