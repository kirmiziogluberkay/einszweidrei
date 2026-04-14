'use client';

import { useState } from 'react';
import { Lock, Unlock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function StatusToggle({ adId, currentStatus, categoryId, categories }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const findRootSlug = (cId) => {
    const cat = categories.find(c => c.id === cId);
    if (!cat) return '';
    if (!cat.parent_id) return cat.slug;
    return findRootSlug(cat.parent_id);
  };

  const handleToggle = async () => {
    setLoading(true);

    const rootSlug = findRootSlug(categoryId).toLowerCase();

    let targetStatus = 'passive';
    if (rootSlug.includes('rental') || rootSlug.includes('accommodation')) targetStatus = 'rented';
    else if (rootSlug.includes('second-hand')) targetStatus = 'reserved';

    const newStatus = currentStatus === 'active' ? targetStatus : 'active';

    const res = await fetch(`/api/ads/${adId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Update failed: ' + (data.error ?? 'Unknown error'));
    }
    setLoading(false);
  };

  const isReservedOrRented = currentStatus === 'reserved' || currentStatus === 'rented';
  const rootSlug = findRootSlug(categoryId).toLowerCase();

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`btn-owner-action w-full
        ${isReservedOrRented
          ? 'bg-brand-50 border-brand-100 text-brand-600 hover:bg-brand-100'
          : 'bg-white border-surface-tertiary text-ink hover:bg-surface-secondary'
        } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {currentStatus === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          {currentStatus === 'active'
            ? ((rootSlug.includes('rental') || rootSlug.includes('accommodation')) ? 'Rented' : 'Reserved')
            : 'Activate'
          }
        </>
      )}
    </button>
  );
}
