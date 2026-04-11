'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Marquee() {
  const [settings, setSettings] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    let channel;
    let isMounted = true;

    async function fetchSettings() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'marquee')
        .single();

      if (isMounted && data) {
        setSettings(data.value);
      }

      // Only subscribe to realtime after the initial fetch, and only if the
      // component is still mounted. This prevents the "WebSocket closed before
      // connection established" warning caused by early unmounts (StrictMode).
      if (!isMounted) return;

      channel = supabase
        .channel('site_settings_marquee')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'key=eq.marquee'
        }, (payload) => {
          if (isMounted) setSettings(payload.new.value);
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[Marquee] Realtime channel error — will use polling fallback.');
          }
        });
    }

    fetchSettings();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel).catch(() => {});
    };
  }, []);

  if (!settings || !settings.active || !settings.text) return null;

  return (
    <div className="bg-brand-600 text-white py-2 overflow-hidden whitespace-nowrap relative z-[60]">
      <div 
        className="inline-block animate-marquee"
        style={{ 
          animationDuration: `${settings.speed || 15}s`,
          paddingLeft: '100%'
        }}
      >
        <span className="text-sm font-bold tracking-wide uppercase px-4">
          {settings.text}
        </span>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}
