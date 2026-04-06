// update 20:56
/**
 * app/adv/[seriNo]/DeleteAdButton.jsx
 * ─────────────────────────────────────────────────────
 * İlan sahibinin ilanı silmesini sağlayan buton.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants/config';

export default function DeleteAdButton({ adId }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!adId) return;
    
    // Tarayıcı onay kutusu
    const confirmed = window.confirm('Are you sure you want to delete this ad? This action cannot be undone.');
    if (!confirmed) return;

    setLoading(true);
    
    // Supabase silme işlemi
    // RLS (Row Level Security) zaten bu işlemi sadece sahibine/admin'e kısıtlamış olmalı
    const { error } = await supabase
      .from('ads')
      .delete()
      .eq('id', adId);

    if (error) {
      alert(ERROR_MESSAGES.generic + ' ' + error.message);
      setLoading(false);
    } else {
      alert(SUCCESS_MESSAGES.adDeleted);
      // Başarılı silme sonrası ana sayfaya yönlendir
      router.push('/');
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="btn-owner-action bg-red-50 text-red-500 border-red-100 hover:bg-red-200"
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
