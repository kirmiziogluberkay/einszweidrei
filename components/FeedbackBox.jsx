'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Send, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function FeedbackBox() {
  const [isOpen,    setIsOpen]    = useState(false);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    async function fetchAdmin() {
      try {
        const res = await fetch('/api/profiles?role=admin&limit=1');
        if (!res.ok) return;
        const data = await res.json();
        const admin = Array.isArray(data) ? data[0] : data.profiles?.[0];
        if (admin?.id) setAdminId(admin.id);
      } catch { /* silent */ }
    }
    fetchAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    if (!user) {
      alert('Please login to send a suggestion.');
      return;
    }

    if (!adminId) {
      alert('Could not find an admin to send feedback to.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ receiver_id: adminId, content: `[FEEDBACK]: ${text}` }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert('Failed to send: ' + (data.error ?? 'Unknown error'));
    } else {
      setSubmitted(true);
      setText('');
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 3000);
    }
  };

  return (
    <div className="mt-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full relative overflow-hidden group p-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
            <Lightbulb className="w-12 h-12" />
          </div>
          <div className="relative z-10 flex flex-col items-start gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Help us improve</span>
            <span className="text-sm font-bold">Make a Suggestion</span>
          </div>
        </button>
      ) : (
        <div className="card p-4 border-2 border-brand-100 bg-brand-50/30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-brand-700 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-brand-500" />
              New Idea?
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white rounded-lg text-brand-400 hover:text-brand-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {submitted ? (
            <div className="py-4 text-center animate-in zoom-in">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-green-600">Thanks for your feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How can we make this platform better?"
                className="w-full text-xs p-3 rounded-xl border-0 ring-1 ring-brand-100 focus:ring-2 focus:ring-brand-500 bg-white min-h-[80px] resize-none"
                required
              />
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-2"
              >
                {loading ? 'Sending...' : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Send to Admin
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
