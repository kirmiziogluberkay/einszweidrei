'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Play, Pause, FastForward } from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Sky Blue',    bg: '#0ea5e9', text: '#ffffff' },
  { label: 'Brand Dark',  bg: '#0284c7', text: '#ffffff' },
  { label: 'Emerald',     bg: '#10b981', text: '#ffffff' },
  { label: 'Amber',       bg: '#f59e0b', text: '#ffffff' },
  { label: 'Red',         bg: '#ef4444', text: '#ffffff' },
  { label: 'Violet',      bg: '#7c3aed', text: '#ffffff' },
  { label: 'Slate',       bg: '#475569', text: '#ffffff' },
  { label: 'Black',       bg: '#0f172a', text: '#ffffff' },
  { label: 'White',       bg: '#f8fafc', text: '#0f172a' },
  { label: 'Gold',        bg: '#fbbf24', text: '#1e293b' },
];

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [settings, setSettings] = useState({
    text:      '',
    speed:     15,
    active:    true,
    bgColor:   '#0ea5e9',
    textColor: '#ffffff',
  });
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/settings?key=marquee');
      if (res.ok) {
        const data = await res.json();
        if (data.value) {
          setSettings(prev => ({
            ...prev,
            ...data.value,
            bgColor:   data.value.bgColor   || '#0ea5e9',
            textColor: data.value.textColor || '#ffffff',
          }));
        }
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch('/api/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ marquee: settings }),
    });

    setSaving(false);
    if (res.ok) {
      setSavedAt(new Date().toLocaleTimeString());
    } else {
      const data = await res.json().catch(() => ({}));
      alert('Error saving settings: ' + (data.error ?? 'Unknown error'));
    }
  };

  const applyPreset = (preset) => {
    setSettings(p => ({ ...p, bgColor: preset.bg, textColor: preset.text }));
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

          {/* Speed */}
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

          {/* Colors */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-ink-secondary uppercase tracking-wider">Colors</label>

            {/* Presets */}
            <div>
              <p className="text-[11px] text-ink-tertiary mb-2 font-medium">Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    title={preset.label}
                    onClick={() => applyPreset(preset)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                      settings.bgColor === preset.bg ? 'border-brand-500 scale-110 shadow-md' : 'border-surface-tertiary'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                  />
                ))}
              </div>
            </div>

            {/* Custom pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Background Color</label>
                <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                  <input
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) => setSettings(p => ({ ...p, bgColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <div>
                    <p className="text-xs font-mono font-bold text-ink">{settings.bgColor.toUpperCase()}</p>
                    <p className="text-[10px] text-ink-tertiary">Background</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-ink-secondary uppercase tracking-wider">Text Color</label>
                <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => setSettings(p => ({ ...p, textColor: e.target.value }))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <div>
                    <p className="text-xs font-mono font-bold text-ink">{settings.textColor.toUpperCase()}</p>
                    <p className="text-[10px] text-ink-tertiary">Text</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save */}
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
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview */}
      {settings.active && (
        <div className="mt-8">
          <p className="text-xs font-bold text-ink-tertiary uppercase tracking-widest mb-3">Live Preview</p>
          <div className="rounded-2xl overflow-hidden border border-surface-tertiary shadow-sm">
            <div
              className="py-1 overflow-hidden whitespace-nowrap"
              style={{ backgroundColor: settings.bgColor }}
            >
              <div
                className="inline-block animate-preview-marquee"
                style={{ animationDuration: `${settings.speed}s`, paddingLeft: '100%' }}
              >
                <span
                  className="text-sm font-bold uppercase px-4 tracking-wide"
                  style={{ color: settings.textColor }}
                >
                  {settings.text || 'TYPE SOMETHING ABOVE'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes preview-marquee {
          0%   { transform: translate3d(0, 0, 0); }
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
