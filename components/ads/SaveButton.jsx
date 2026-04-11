'use client';

/**
 * components/ads/SaveButton.jsx
 * ─────────────────────────────────────────────────────
 * İlan kaydetme / takip etme düğmesi.
 * userId prop'a gerek yok — useAuth ile kendi içinde yönetir.
 * iconOnly=true → kart üzerindeki kompakt daire varyantı.
 * ─────────────────────────────────────────────────────
 */

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSavedAds } from '@/hooks/useSavedAds';
import { cn } from '@/lib/helpers';

/**
 * @param {{
 *   adId: string,
 *   iconOnly?: boolean,
 *   className?: string
 * }} props
 */
export default function SaveButton({ adId, iconOnly = false, className }) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { isSaved, toggleSave, isPending, toggleError } = useSavedAds(userId);

  const saved = isSaved(adId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      router.push('/login');
      return;
    }
    toggleSave(adId);
  };

  // ── Kompakt daire ikonu (kart overlay) ──
  if (iconOnly) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending && !!userId}
        aria-label={saved ? 'Remove from saved' : 'Save ad'}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90',
          saved
            ? 'bg-brand-500 text-white'
            : 'bg-white/90 backdrop-blur-sm text-ink-tertiary hover:text-brand-500',
          className
        )}
      >
        <Bookmark className={cn('w-4 h-4', saved && 'fill-current')} />
      </button>
    );
  }

  // ── Normal tam buton (ilan detay sayfası) ──
  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={isPending && !!userId}
        aria-label={saved ? 'Remove from saved' : 'Save ad'}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all w-full justify-center',
          saved
            ? 'bg-brand-500 text-white hover:bg-brand-600'
            : 'bg-surface-secondary text-ink-secondary hover:text-brand-500 hover:bg-brand-50 border border-surface-tertiary',
          className
        )}
      >
        <Bookmark className={cn('w-4 h-4 shrink-0', saved && 'fill-current')} />
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
      {toggleError && (
        <p className="text-[11px] text-red-500 text-center mt-1">{toggleError.message}</p>
      )}
    </div>
  );
}
