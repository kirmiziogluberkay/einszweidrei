'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Send, CheckCircle2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/helpers';

export default function FeedbackBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  const [adminId, setAdminId] = useState(null);

  // Fetch a valid admin ID once when the component is ready
  useEffect(() => {
    async function fetchAdmin() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (data) setAdminId(data.id);
      if (error) console.error('FeedbackBox: Could not find admin', error);
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

    setLoading(true);
    
    // Attempt to send the message to the first found admin
    // Fallback ID if none found (will likely fail but better than hardcoded wrong ID)
    const targetId = adminId || '00000000-0000-0000-0000-000000000000';

    const { error } = await supabase.from('messages').insert({
      content: `[FEEDBACK]: ${text}`,
      receiver_id: targetId,
      sender_id: user.id,
    });

    setLoading(true);
    if (error) {
      console.error('FeedbackBox Error:', error);
      alert('Failed to send: ' + error.message);
      setLoading(false);
    } else {
      setLoading(false);
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
