
'use client';

import { useState } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SoldToggle({ adId, currentStatus }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleToggleSold = async () => {
    setLoading(true);
    const newStatus = currentStatus === 'sold' ? 'active' : 'sold';

    const { error } = await supabase
      .from('ads')
      .update({ status: newStatus })
      .eq('id', adId);

    if (!error) {
      router.refresh();
    } else {
      alert('Update failed: ' + error.message);
    }
    setLoading(false);
  };

  const isSold = currentStatus === 'sold';

  return (
    <button
      onClick={handleToggleSold}
      disabled={loading}
      className={`btn-owner-action w-full transition-all duration-200
        ${isSold 
          ? 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100' 
          : 'bg-white border-surface-tertiary text-ink hover:bg-surface-secondary'
        } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {isSold ? <CheckCircle className="w-4 h-4 text-red-500" /> : <Circle className="w-4 h-4 text-ink-tertiary group-hover:text-red-500" />}
          <span>{isSold ? 'Sold' : 'Mark Sold'}</span>
        </>
      )}
    </button>
  );
}
