/**
 * components/ads/ShareButtons.jsx
 * ─────────────────────────────────────────────────────
 * İlan detay sayfasında gösterilen sosyal paylaşım
 * butonları (WhatsApp ve Telegram).
 * ─────────────────────────────────────────────────────
 */

'use client';

import { buildWhatsAppShareUrl, buildTelegramShareUrl } from '@/lib/helpers';
import { Mail } from 'lucide-react';

/**
 * @param {{
 *   title: string,
 *   serialNumber: string
 * }} props
 */
export default function ShareButtons({ title, serialNumber }) {
  const whatsappUrl  = buildWhatsAppShareUrl(title, serialNumber);
  const telegramUrl  = buildTelegramShareUrl(title, serialNumber);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-secondary font-medium">Share:</span>

      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share via WhatsApp"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-[#25D366] hover:bg-[#1ea355] text-white text-sm font-medium
                   transition-all duration-150 shadow-[0_2px_8px_rgba(37,211,102,0.3)]"
      >
        {/* WhatsApp SVG ikonu */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
            -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475
            -.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52
            .149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207
            -.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372
            -.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2
            5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719
            2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.555 4.122 1.526 5.853L0 24l6.333-1.5
            A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818
            a9.823 9.823 0 01-5.002-1.37l-.36-.213-3.757.89.948-3.65-.234-.374
            A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12
            S17.43 21.818 12 21.818z" />
        </svg>
        WhatsApp
      </a>

      {/* Telegram */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share via Telegram"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-[#0088cc] hover:bg-[#0077bb] text-white text-sm font-medium
                   transition-all duration-150 shadow-[0_2px_8px_rgba(0,136,204,0.3)]"
      >
        {/* Telegram SVG ikonu */}
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.873.75z" />
        </svg>
        Telegram
      </a>

      {/* Email */}
      <a
        href={`mailto:?subject=${encodeURIComponent(`Check out this ad: ${title}`)}&body=${encodeURIComponent(`I thought you might be interested in this ad: ${title}\n\nView it here: ${typeof window !== 'undefined' ? window.location.origin : ''}/ilan/${serialNumber}`)}`}
        aria-label="Share via Email"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                   bg-surface-secondary hover:bg-surface-tertiary text-ink text-sm font-medium
                   transition-all duration-150 border border-surface-tertiary shadow-sm"
      >
        <Mail className="w-5 h-5" />
        Email
      </a>
    </div>
  );
}
