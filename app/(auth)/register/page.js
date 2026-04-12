/**
 * app/(auth)/register/page.js
 * ─────────────────────────────────────────────────────
 * Registration page.
 * User registration: Supabase Auth + profiles table.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SITE_NAME } from '@/constants/config';

const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'moderator', 'mod', 'support', 'help',
  'system', 'root', 'superuser', 'staff', 'team', 'official',
  'info', 'contact', 'noreply', 'no-reply', 'mail', 'email',
  'user', 'users', 'account', 'accounts', 'profile', 'profiles',
  'api', 'dev', 'developer', 'test', 'demo', 'guest', 'anonymous',
  'null', 'undefined', 'void', 'true', 'false',
  'einszweidrei', 'site', 'webmaster', 'postmaster',
]);

export default function RegisterPage() {
  const supabase = createClient();

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
   * Submits the registration form.
   * 1 - Create user with Supabase Auth
   * 2 - Insert record into the profiles table
   *
   * @param {React.FormEvent} e
   */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Password match check
    if (formData.password !== formData.confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Minimum password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    // Username format validation (letters, numbers, and underscores only)
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      setError('Username must be 3-30 characters, containing only letters/numbers/underscores.');
      setLoading(false);
      return;
    }

    // Username blacklist — reserved words cannot be registered
    if (RESERVED_USERNAMES.has(formData.username.toLowerCase())) {
      setError('This username is reserved and cannot be used. Please choose a different one.');
      setLoading(false);
      return;
    }

    // Supabase Auth signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email:    formData.email.trim(),
      password: formData.password,
      options:  {
        data:            { username: formData.username }, // Auth metadata
        emailRedirectTo: 'https://einszweidrei.vercel.app',
      },
    });

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'This email address is already registered.'
        : authError.message);
      setLoading(false);
      return;
    }

    // Create profile via SECURITY DEFINER RPC — works even without a session
    // (direct insert would be blocked by RLS since email is not yet confirmed)
    if (authData.user) {
      const { error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id:  authData.user.id,
        username: formData.username,
      });
      if (rpcError) {
        console.warn('Profile creation error:', rpcError.message);
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="card p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-ink">Almost there!</h2>
            <p className="text-ink-secondary text-sm leading-relaxed">
              We sent a confirmation email to{' '}
              <span className="font-semibold text-ink">{formData.email}</span>.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left space-y-1">
              <p className="text-amber-800 text-sm font-semibold">Please confirm your email address</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                Click the link in the email to activate your account. Check your spam folder if you don't see it.
              </p>
            </div>
            <Link
              href="/login"
              className="btn-primary w-full mt-2 block text-center"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Title */}
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
            {/* Username */}
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

            {/* Email */}
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

            {/* Password */}
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

            {/* Confirm password */}
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
