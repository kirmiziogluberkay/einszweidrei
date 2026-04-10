/**
 * app/myprofile/page.js
 * ─────────────────────────────────────────────────────
 * User profile page (Information only).
 * URL: /myprofile
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Edit3, AlertCircle, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/config';

export default function MyProfilePage() {
  const supabase          = createClient();
  const router            = useRouter();
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    // Navigate away first to prevent Auth Guard from sending us to /login
    router.push('/');
    await signOut();
  };

  // ── Auth Guard ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [editMode,  setEditMode]  = useState(false);
  const [username,  setUsername]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [msgType,   setMsgType]   = useState('success');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdMsgType, setPwdMsgType] = useState('success');
  const [changingPwd, setChangingPwd] = useState(false);

  // Sync state when profile loads
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from('profiles')
      .update({ username: username.trim(), phone: phone.trim() })
      .eq('id', user.id);

    if (error) {
      setMsg(ERROR_MESSAGES.generic);
      setMsgType('error');
    } else {
      await refreshProfile();
      setMsg(SUCCESS_MESSAGES.profileSaved);
      setMsgType('success');
      setEditMode(false);
      router.refresh();
    }

    setSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (!newPassword || newPassword.length < 6) {
      setPwdMsg('Password must be at least 6 characters.');
      setPwdMsgType('error');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg('Passwords do not match.');
      setPwdMsgType('error');
      return;
    }

    setChangingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPwd(false);

    if (error) {
      setPwdMsg(error.message);
      setPwdMsgType('error');
    } else {
      setPwdMsg('Password updated successfully.');
      setPwdMsgType('success');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-8 max-w-3xl">
      <h1 className="section-title">My Profile</h1>

      {msg && (
        <div className={`flex items-start gap-2 p-4 rounded-2xl text-sm mb-6 ${
          msgType === 'success'
            ? 'bg-green-50 border border-green-100 text-green-600'
            : 'bg-red-50 border border-red-100 text-red-600'
        }`}>
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-ink">My Information</h2>
          {!editMode && (
            <button
              onClick={() => {
                setUsername(profile?.username ?? '');
                setPhone(profile?.phone ?? '');
                setEditMode(true);
              }}
              className="btn-secondary py-2 text-sm"
            >
              <Edit3 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label htmlFor="profile-username" className="label">Username</label>
              <input
                id="profile-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="label">Phone</label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+xx xxx xxx xx xx"
                className="input"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving</> : 'Save'}
              </button>
              <button type="button" onClick={() => setEditMode(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Username</dt>
              <dd className="font-medium text-ink">{profile?.username ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Email</dt>
              <dd className="font-medium text-ink">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-secondary">Phone</dt>
              <dd className="font-medium text-ink">{profile?.phone ?? '—'}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Password Change Card */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-ink mb-5">Change Password</h2>
        
        {pwdMsg && (
          <div className={`flex items-start gap-2 p-4 rounded-2xl text-sm mb-6 ${
            pwdMsgType === 'success'
              ? 'bg-green-50 border border-green-100 text-green-600'
              : 'bg-red-50 border border-red-100 text-red-600'
          }`}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{pwdMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="Minimum 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" disabled={changingPwd} className="btn-primary w-auto inline-flex px-6 items-center gap-2 mt-2">
            {changingPwd ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </div>

      {/* Logout Button for Mobile/Profile Context */}
      <div className="card p-6 border border-red-100/50">
        <button
          onClick={handleSignOut}
          className="w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
}
