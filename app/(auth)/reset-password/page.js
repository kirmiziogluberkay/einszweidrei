'use client';

import { useState, Suspense }               from 'react';
import Link                                  from 'next/link';
import { useRouter, useSearchParams }        from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { SITE_NAME }                         from '@/constants/config';

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') || '';

  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [done,       setDone]       = useState(false);

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-semibold text-ink">Invalid reset link</p>
          <p className="text-sm text-ink-secondary mt-1">This link is missing a token. Please request a new one.</p>
          <Link href="/forgot-password" className="btn-primary mt-5 inline-block py-2.5 px-6 text-sm">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const res  = await fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
    } else {
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Set New Password</h1>
          <p className="text-sm text-ink-secondary mt-1">Choose a strong password for your account</p>
        </div>

        <div className="card p-6 sm:p-8">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-semibold text-ink">Password updated!</p>
              <p className="text-sm text-ink-secondary">Redirecting you to login…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-5">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="new-password" className="label">New Password</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-ink-tertiary mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="label">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                    : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        {!done && (
          <p className="text-center text-sm text-ink-secondary mt-5">
            Remember your password?{' '}
            <Link href="/login" className="text-brand-500 font-medium hover:underline">Log In</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
