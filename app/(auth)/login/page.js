'use client';

import { useState, Suspense }    from 'react';
import Link                      from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth }               from '@/providers/AuthProvider';
import { SITE_NAME }             from '@/constants/config';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 60_000;

function LoginContent() {
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const { refreshProfile } = useAuth();

  const rawRedirect = searchParams.get('redirect') || '/';
  const redirectTo  = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [attempts,    setAttempts]    = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (lockedUntil && Date.now() < lockedUntil) {
      const secsLeft = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many failed attempts. Please wait ${secsLeft} seconds.`);
      return;
    }

    setLoading(true);

    const res  = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim(), password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        setError('Too many failed attempts. Please wait 60 seconds before trying again.');
      } else {
        setError(`${data.error ?? 'Invalid email or password.'} (${next}/${MAX_ATTEMPTS} attempts)`);
      }
      setLoading(false);
      return;
    }

    setAttempts(0);
    setLockedUntil(null);
    await refreshProfile();
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Welcome</h1>
          <p className="text-sm text-ink-secondary mt-1">Log in to your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <input
                id="login-email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sample@mail.com" required autoComplete="email" className="input"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs text-brand-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password" type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password" className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-secondary transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || (lockedUntil && Date.now() < lockedUntil)}
              id="login-submit-btn"
              className="btn-primary w-full py-3"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging in...</> : 'Log In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-5">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-500 font-medium hover:underline">Sign Up</Link>
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
