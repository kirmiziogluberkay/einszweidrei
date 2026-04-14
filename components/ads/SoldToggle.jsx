'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SoldToggle({ adId, currentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleSold = async () => {
    setLoading(true);
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';

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

  const isSold = currentStatus === 'sold';

  return (
    <button
      onClick={handleToggleSold}
      disabled={loading}
      className={`btn-owner-action w-full transition-all duration-200
        ${!isSold
          ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
          : 'bg-white border-surface-tertiary text-ink hover:bg-surface-secondary'
        } disabled:opacity-50`}
      title={isSold ? 'For Sale' : 'Sold'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {isSold ? <Circle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 text-red-500" />}
          <span>{isSold ? 'For Sale' : 'Sold'}</span>
        </>
      )}
    </button>
  );
}
