'use client';

import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MessageThread from '@/components/messages/MessageThread';

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
        {open ? 'Close' : 'Send Message'}
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
