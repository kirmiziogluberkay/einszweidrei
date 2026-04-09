'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Marquee() {
  const [settings, setSettings] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'marquee')
        .single();
      
      if (data) {
        setSettings(data.value);
      }
    }

    fetchSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'site_settings',
        filter: 'key=eq.marquee'
      }, (payload) => {
        setSettings(payload.new.value);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
