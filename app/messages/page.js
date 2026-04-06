/**
 * app/messages/page.js - DEBUG VERSION
 */

'use client';

import { useState, useEffect } from 'react';
import { Loader2, MessageSquareOff } from 'lucide-react';

export default function MessagesPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="container-app py-16 text-center">
      <div className="card p-12 max-w-lg mx-auto shadow-sm">
        <MessageSquareOff className="w-16 h-16 text-brand-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-ink mb-4">Messages (Under Maintenance)</h1>
        <p className="text-ink-secondary mb-8">
          The messages page is undergoing a minor upgrade. Please try again in 5 minutes.
        </p>
        <button onClick={() => window.location.href = '/'} className="btn-primary px-8 py-3">
          Go back to Home
        </button>
      </div>
    </div>
  );
}
