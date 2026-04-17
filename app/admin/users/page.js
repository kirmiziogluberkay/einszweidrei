'use client';

import { useState, useEffect } from 'react';
import { Search, Shield, User, RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/helpers';

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users,   setUsers]   = useState([]);
  const [search,  setSearch]  = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    const res = await fetch(`/api/profiles?${params}`);
    if (res.ok) {
      const data = await res.json();
      const all  = Array.isArray(data) ? data : [];
      const filtered = search
        ? all.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()))
        : all;
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setUsers(filtered);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    const res = await fetch(`/api/profiles/${userId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Failed to change role: ' + (data.error ?? 'Unknown error'));
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    // If undefined in older records, defaults to active
    const newStatus = (!currentStatus || currentStatus === 'active') ? 'pending' : 'active';
    if (!confirm(`Are you sure you want to change this user's status to ${newStatus.toUpperCase()}?`)) return;

    const res = await fetch(`/api/profiles/${userId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Failed to change status: ' + (data.error ?? 'Unknown error'));
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you SURE you want to permanently delete this user? All their ads and messages will also be deleted!')) return;

    const res = await fetch(`/api/profiles/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Failed to delete user: ' + (data.error ?? 'Unknown error'));
    }
  };

  return (
    <div className="animate-in fade-in transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-sm text-ink-secondary mt-1">Manage user roles and profiles</p>
        </div>
        <button onClick={fetchUsers} className="btn-secondary py-2 px-4 flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        <input
          type="search"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
          className="input pl-10"
        />
      </div>

      <div className="card shadow-sm border-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-surface-secondary/50 text-ink-secondary border-b border-surface-tertiary">
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">User</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Role</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Joined</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading && users.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><div className="skeleton h-5 w-full rounded" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-ink-tertiary">No users found.</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-brand-50/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-tertiary flex items-center justify-center text-ink-secondary">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-ink">@{u.username}</p>
                        <p className="text-[11px] text-ink-tertiary font-mono">{u.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      u.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-surface-tertiary/40 text-ink-secondary'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                      {u.role?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      u.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {u.status === 'pending' ? 'PENDING' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-tertiary text-xs">{timeAgo(u.created_at)}</td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-3 h-full pt-6">
                    <button onClick={() => toggleStatus(u.id, u.status)} className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline">
                      Toggle Status
                    </button>
                    <button onClick={() => toggleRole(u.id, u.role)} className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">
                      Change Role
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
