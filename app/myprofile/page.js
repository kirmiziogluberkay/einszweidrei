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
import { Loader2, Edit3, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/config';

export default function MyProfilePage() {
  const supabase          = createClient();
  const router            = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  // ── Auth Guard ──
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [editMode,  setEditMode]  = useState(false);
  const [username,  setUsername]  = useState(profile?.username ?? '');
  const [phone,     setPhone]     = useState(profile?.phone ?? '');
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null);
  const [msgType,   setMsgType]   = useState('success');

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
      setMsg(SUCCESS_MESSAGES.profileSaved);
      setMsgType('success');
      setEditMode(false);
    }

    setSaving(false);
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
    </div>
  );
}
