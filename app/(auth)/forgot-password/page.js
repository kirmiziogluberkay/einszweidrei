'use client';

import { useState }  from 'react';
import Link          from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { SITE_NAME } from '@/constants/config';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res  = await fetch('/api/auth/forgot-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.');
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Forgot Password</h1>
          <p className="text-sm text-ink-secondary mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="font-semibold text-ink">Check your inbox</p>
              <p className="text-sm text-ink-secondary">
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
              </p>
              <Link href="/login" className="btn-primary mt-2 w-full py-2.5 text-sm text-center">
                Back to Login
              </Link>
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
                  <label htmlFor="forgot-email" className="label">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sample@mail.com"
                    required
                    autoComplete="email"
                    className="input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>

        {!sent && (
          <p className="text-center text-sm text-ink-secondary mt-5">
            <Link href="/login" className="text-brand-500 font-medium hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
