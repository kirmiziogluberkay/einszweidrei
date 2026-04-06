/**
 * app/inbox/page.js - DEBUG PAGE
 */

'use client';

import { useState, useEffect } from 'react';

export default function InboxPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{
      padding: '50px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Inbox Page Test</h1>
      <p style={{ color: '#666' }}>This confirms the routing for "/inbox" is working.</p>
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Go Back Home
        </button>
      </div>
    </div>
  );
}
