'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Loader2 } from 'lucide-react';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/config';

export default function DeleteAdButton({ adId }) {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!adId) return;
    const confirmed = window.confirm('Are you sure you want to delete this ad? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);

    const res = await fetch(`/api/ads/${adId}`, { method: 'DELETE' });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(ERROR_MESSAGES.generic + ' ' + (data.error ?? ''));
      setLoading(false);
      return;
    }

    alert(SUCCESS_MESSAGES.adDeleted);
    await queryClient.invalidateQueries({ queryKey: ['ads'] });
    router.push('/');
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn-owner-action w-full bg-red-50 text-red-500 border-red-100 hover:bg-red-200"
      title="Delete Ad"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </>
      )}
    </button>
  );
}
