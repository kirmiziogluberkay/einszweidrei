'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Loader2, Play, Pause, FastForward } from 'lucide-react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    text: '',
    speed: 15,
    active: true
  });
  const [savedAt, setSavedAt] = useState(null);

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
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase
      .from('site_settings')
      .upsert({ 
        key: 'marquee', 
        value: settings 
      }, { onConflict: 'key' });

    setSaving(false);
    if (!error) {
      setSavedAt(new Date().toLocaleTimeString());
    } else {
      alert('Error saving settings: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">Site Settings</h1>
        <p className="text-sm text-ink-secondary mt-1">Manage global site features and appearance</p>
      </div>

      <div className="card bg-white p-6 shadow-sm border border-surface-tertiary">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-50 rounded-xl">
            <FastForward className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 className="font-bold text-ink">Marquee (Scrolling Text)</h2>
            <p className="text-xs text-ink-tertiary">Control the announcement bar at the top of the site</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-secondary rounded-2xl">
            <div className="flex items-center gap-3">
              {settings.active ? <Play className="w-4 h-4 text-green-500" /> : <Pause className="w-4 h-4 text-ink-tertiary" />}
              <div>
                <p className="text-sm font-bold text-ink">Status</p>
                <p className="text-[10px] text-ink-tertiary uppercase font-bold tracking-wider">
                  {settings.active ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSettings(p => ({ ...p, active: !p.active }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.active ? 'bg-brand-500' : 'bg-surface-tertiary'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.active ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Content Text</label>
            <input
              type="text"
              value={settings.text}
              onChange={(e) => setSettings(p => ({ ...p, text: e.target.value }))}
              placeholder="Enter marquee message..."
              className="input text-sm"
              required
            />
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Scrolling Speed</label>
              <span className="text-xs font-mono text-brand-600 font-bold">{settings.speed}s</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={settings.speed}
              onChange={(e) => setSettings(p => ({ ...p, speed: parseInt(e.target.value) }))}
              className="w-full appearance-none bg-surface-tertiary h-1.5 rounded-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ink-tertiary font-bold px-1">
              <span>FAST (5s)</span>
              <span>SLOW (60s)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-surface-tertiary flex items-center justify-between">
            <div className="text-[11px] text-ink-tertiary">
              {savedAt && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Last saved at {savedAt}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5 px-6 flex items-center gap-2 text-sm shadow-md"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Preview Section */}
      {settings.active && (
        <div className="mt-8">
          <p className="text-xs font-bold text-ink-tertiary uppercase tracking-widest mb-3">Live Preview</p>
          <div className="rounded-2xl overflow-hidden border border-surface-tertiary shadow-sm">
             {/* Small preview of the marquee */}
             <div className="bg-brand-600 text-white py-2 overflow-hidden whitespace-nowrap">
                <div 
                  className="inline-block animate-preview-marquee"
                  style={{ 
                    animationDuration: `${settings.speed}s`,
                    paddingLeft: '100%'
                  }}
                >
                  <span className="text-sm font-bold uppercase transition-all duration-300">
                    {settings.text || 'TYPE SOMETHING ABOVE'}
                  </span>
                </div>
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes preview-marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-100%, 0, 0); }
        }
        .animate-preview-marquee {
          display: inline-block;
          animation: preview-marquee linear infinite;
        }
      `}</style>
    </div>
  );
}
