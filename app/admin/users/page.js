'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Shield, User, Loader2, RefreshCw } from 'lucide-react';
import { timeAgo } from '@/lib/helpers';

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('username', `%${search}%`);
    }

    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    // Use RPC to bypass RLS limitations on profile table updates
    const { error } = await supabase.rpc('toggle_user_role', { 
      target_user_id: userId, 
      target_role: newRole 
    });

    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      alert("Failed to change role: " + error.message);
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
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Joined</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loading && users.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-6 py-4"><div className="skeleton h-5 w-full rounded" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-ink-tertiary">No users found.</td>
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
                  <td className="px-6 py-4 text-ink-tertiary text-xs">
                    {timeAgo(u.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleRole(u.id, u.role)}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Change Role
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
