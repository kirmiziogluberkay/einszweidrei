'use client';

/**
 * components/ads/SaveButton.jsx
 * ─────────────────────────────────────────────────────
 * İlan kaydetme / takip etme düğmesi.
 * Giriş yapılmamışsa /login'e yönlendirir.
 * ─────────────────────────────────────────────────────
 */

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSavedAds } from '@/hooks/useSavedAds';
import { cn } from '@/lib/helpers';

/**
 * @param {{
 *   adId: string,
 *   userId: string | null,
 *   className?: string
 * }} props
 */
export default function SaveButton({ adId, userId, className }) {
  const router = useRouter();
  const { isSaved, toggleSave, isPending, toggleError } = useSavedAds(userId);

  const saved = isSaved(adId);

  const handleClick = () => {
    if (!userId) {
      router.push('/login');
      return;
    }
    toggleSave(adId);
  };

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
