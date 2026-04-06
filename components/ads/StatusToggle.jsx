// update 20:41
'use client';

import { useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * İlan detay sayfasında sahibine özel 'Rezerve Et / Kiraladı' butonu.
 */
export default function StatusToggle({ adId, currentStatus, categoryId, categories, ownerId }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Kök kategorinin slug değerini bul:
  const findRootSlug = (cId) => {
    const cat = categories.find(c => c.id === cId);
    if (!cat) return '';
    if (!cat.parent_id) return cat.slug;
    return findRootSlug(cat.parent_id);
  };

  const handleToggle = async () => {
    setLoading(true);
    
    const rootSlug = findRootSlug(categoryId).toLowerCase();
    
    // Kök kategoriye Göre Ayrım:
    let targetStatus = 'passive';
    if (rootSlug.includes('rental')) targetStatus = 'rented';
    else if (rootSlug.includes('second-hand')) targetStatus = 'reserved';
    
    const newStatus = currentStatus === 'active' ? targetStatus : 'active';

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

  const isReservedOrRented = currentStatus === 'reserved' || currentStatus === 'rented';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-sm border
        ${isReservedOrRented 
          ? 'bg-brand-50 border-brand-100 text-brand-600 hover:bg-brand-100' 
          : 'bg-white border-surface-tertiary text-ink hover:bg-surface-secondary'
        } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Lock className="w-4 h-4" />
          {currentStatus === 'active' 
            ? (findRootSlug(categoryId).includes('rental') ? 'Rented' : 'Reserved')
            : 'Activate'
          }
        </>
      )}
    </button>
  );
}
