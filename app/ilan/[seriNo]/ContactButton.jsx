/**
 * app/ilan/[seriNo]/ContactButton.jsx
 * ─────────────────────────────────────────────────────
 * İstemci bileşeni — Mesaj gönder butonunu yönetir.
 * ─────────────────────────────────────────────────────
 */

'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageThread from '@/components/messages/MessageThread';

/**
 * "Mesaj Gönder" butonunu ve açılan sohbet panelini render eder.
 */
export default function ContactButton({ adId, adTitle, receiverId, receiverName }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        id="contact-seller-btn"
        onClick={() => setOpen(!open)}
        className="btn-primary w-full"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {open ? 'Kapat' : 'Mesaj Gönder'}
      </button>

      {open && (
        <div className="mt-4 border border-surface-tertiary rounded-2xl overflow-hidden h-80 flex flex-col">
          <MessageThread
            adId={adId}
            adTitle={adTitle}
            receiverId={receiverId}
            receiverName={receiverName}
          />
        </div>
      )}
    </>
  );
}
