'use client';

import { useState }             from 'react';
import Link                     from 'next/link';
import { useRouter }            from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth }              from '@/providers/AuthProvider';
import { SITE_NAME }            from '@/constants/config';

export default function RegisterPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    const res  = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        username: formData.username,
        email:    formData.email,
        password: formData.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Registration failed.');
      setLoading(false);
      return;
    }

    // Auto-logged-in — refresh auth state and redirect
    await refreshProfile();
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/'), 1500);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-ink">Welcome!</h2>
            <p className="text-ink-secondary text-sm">Your account has been created. Redirecting…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-ink hover:text-brand-500 transition-colors">
            {SITE_NAME}
          </Link>
          <h1 className="text-xl font-semibold text-ink mt-3">Create Account</h1>
          <p className="text-sm text-ink-secondary mt-1">Sign up for free now</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="reg-username" className="label">Username</label>
              <input id="reg-username" type="text" name="username" value={formData.username}
                onChange={handleChange} placeholder="your_username" required autoComplete="username" className="input" />
            </div>
            <div>
              <label htmlFor="reg-email" className="label">Email</label>
              <input id="reg-email" type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="sample@mail.com" required autoComplete="email" className="input" />
            </div>
            <div>
              <label htmlFor="reg-password" className="label">Password</label>
              <input id="reg-password" type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="Min. 8 characters" required autoComplete="new-password" minLength={8} className="input" />
            </div>
            <div>
              <label htmlFor="reg-confirm" className="label">Confirm Password</label>
              <input id="reg-confirm" type="password" name="confirm" value={formData.confirm}
                onChange={handleChange} placeholder="Re-enter password" required autoComplete="new-password" className="input" />
            </div>
            <button type="submit" disabled={loading} id="register-submit-btn" className="btn-primary w-full py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing up…</> : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-secondary mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-500 font-medium hover:underline">Log In</Link>
        </p>
      </div>
    </div>
  );
}
