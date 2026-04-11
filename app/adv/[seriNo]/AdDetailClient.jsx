'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/helpers';

export default function AdDetailClient({ images, title }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasImages = images?.length > 0;

  const prev = () => setActiveIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIndex((i) => (i + 1) % images.length);

  if (!hasImages) {
    return (
      <div className="aspect-[4/3] bg-surface-secondary rounded-3xl flex items-center justify-center text-ink-tertiary">
        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586
               a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] bg-surface-secondary rounded-3xl overflow-hidden group">
        <Image
          src={images[activeIndex]}
          alt={`${title} — image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2
                         w-10 h-10 rounded-full bg-black/40 text-white
                         flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2
                         w-10 h-10 rounded-full bg-black/40 text-white
                         flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActiveIndex(i)}
              aria-label={`Image ${i + 1}`}
              className={cn(
                'flex-shrink-0 relative w-16 h-16 rounded-xl overflow-hidden transition-all',
                i === activeIndex
                  ? 'ring-2 ring-brand-500 ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              )}
            >
              <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
