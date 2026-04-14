'use client';

import { useState, useEffect } from 'react';

export default function Marquee() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings?key=marquee');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.value) setSettings(data.value);
      } catch { /* silent */ }
    }
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  if (!settings || !settings.active || !settings.text) return null;

  const bg      = settings.bgColor   || '#0ea5e9';
  const textCol = settings.textColor || '#ffffff';

  return (
    <div
      className="overflow-hidden whitespace-nowrap relative z-[60] py-0.5"
      style={{ backgroundColor: bg }}
    >
      <div
        className="inline-block animate-marquee"
        style={{
          animationDuration: `${settings.speed || 15}s`,
          paddingLeft: '100%',
        }}
      >
        <span
          className="text-sm font-bold tracking-wide uppercase px-4"
          style={{ color: textCol }}
        >
          {settings.text}
        </span>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translate3d(0, 0, 0); }
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
