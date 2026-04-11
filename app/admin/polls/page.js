'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, CheckCircle, Power } from 'lucide-react';

export default function AdminPollsPage() {
  const supabase = createClient();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  // Global polls on/off toggle
  const [pollsEnabled, setPollsEnabled] = useState(true);
  const [togglingEnabled, setTogglingEnabled] = useState(false);

  // Form State
  const [newQuestion, setNewQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    fetchPolls();
    fetchPollsEnabled();
  }, []);

  const fetchPollsEnabled = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'polls_enabled')
      .single();
    if (data) setPollsEnabled(data.value === 'true');
  };

  const handleToggleEnabled = async () => {
    setTogglingEnabled(true);
    const next = !pollsEnabled;
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'polls_enabled', value: String(next), updated_at: new Date().toISOString() })
      .eq('key', 'polls_enabled');

    if (!error) {
      setPollsEnabled(next);
      setMsg({ type: 'success', text: `Polls ${next ? 'enabled' : 'disabled'} on homepage.` });
    } else {
      setMsg({ type: 'error', text: error.message });
    }
    setTogglingEnabled(false);
  };

  const fetchPolls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPolls(data);
    } else if (error) {
      console.error('Fetch polls error:', error);
      setMsg({ type: 'error', text: 'Could not load polls (Check if tables exist)' });
    }
    setLoading(false);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!newQuestion.trim()) return setMsg({ type: 'error', text: 'Question is required' });
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) return setMsg({ type: 'error', text: 'Minimum 2 options required' });

    // Insert Poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({ question: newQuestion.trim(), is_active: false })
      .select()
      .single();

    if (pollError) return setMsg({ type: 'error', text: pollError.message });

    // Insert Options
    const optionsToInsert = validOptions.map(opt => ({
      poll_id: poll.id,
      option_text: opt.trim(),
    }));

    const { error: optError } = await supabase.from('poll_options').insert(optionsToInsert);
    if (optError) return setMsg({ type: 'error', text: optError.message });

    setMsg({ type: 'success', text: 'Poll created successfully!' });
    setNewQuestion('');
    setOptions(['', '']);
    fetchPolls();
  };

  const handleSetActive = async (id) => {
    // Deactivate all first
    await supabase.from('polls').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    // Set target to active
    const { error } = await supabase.from('polls').update({ is_active: true }).eq('id', id);
    if (!error) {
       setMsg({ type: 'success', text: 'Active poll updated!' });
       fetchPolls();
    } else {
       setMsg({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this poll?')) return;
    const { error } = await supabase.from('polls').delete().eq('id', id);
    if (!error) {
       setMsg({ type: 'success', text: 'Poll deleted' });
       fetchPolls();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-ink">Question Pool (Polls)</h1>

        {/* Global on/off toggle */}
        <button
          onClick={handleToggleEnabled}
          disabled={togglingEnabled}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 font-semibold text-sm transition-all ${
            pollsEnabled
              ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
              : 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
          }`}
        >
          <Power className={`w-4 h-4 ${togglingEnabled ? 'animate-pulse' : ''}`} />
          {/* Toggle pill */}
          <span className="flex items-center gap-2">
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                pollsEnabled ? 'bg-green-500' : 'bg-red-400'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  pollsEnabled ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </span>
            {pollsEnabled ? 'Polls: ON' : 'Polls: OFF'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="card p-6 md:col-span-1 border-brand-100 bg-brand-50/20">
          <h2 className="text-lg font-semibold mb-4">Create New Poll</h2>
          
          {msg && (
            <div className={`p-3 rounded-xl text-sm mb-4 ${
              msg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <label className="label">Question *</label>
              <input 
                type="text" 
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="Ex: What percentage of our body is water?"
                className="input"
                required
              />
            </div>
            
            <div>
              <label className="label">Options *</label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input 
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[i] = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="input py-2"
                    required={i < 2}
                  />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions(options.filter((_, idx) => idx !== i))} className="btn-secondary px-3 py-0 text-red-500 border-red-200">X</button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={() => setOptions([...options, ''])}
                className="btn-secondary w-full text-xs py-2 mt-1 border-dashed"
              >
                + Add Another Option
              </button>
            </div>
            
            <button type="submit" className="btn-primary w-full mt-4">
              Save Poll to Pool
            </button>
          </form>
        </div>

        {/* Existing Polls */}
        <div className="md:col-span-2 space-y-4">
          {loading ? (
             <p className="text-ink-secondary">Loading polls...</p>
          ) : polls.length === 0 ? (
             <div className="card p-6 text-center text-ink-secondary">No polls found. Create one from the left!</div>
          ) : (
             polls.map(poll => (
               <div key={poll.id} className={`card p-5 border-2 transition-all ${poll.is_active ? 'border-green-500 bg-green-50/30' : 'border-surface-tertiary'}`}>
                 <div className="flex justify-between items-start mb-3">
                   <h3 className="font-bold text-ink text-lg">{poll.question}</h3>
                   <div className="flex items-center gap-2">
                     {!poll.is_active ? (
                       <button onClick={() => handleSetActive(poll.id)} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1">
                         <CheckCircle className="w-3 h-3" /> Set Active
                       </button>
                     ) : (
                       <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full border border-green-200 uppercase tracking-widest">Active Live</span>
                     )}
                     <button onClick={() => handleDelete(poll.id)} className="btn-secondary py-1.5 px-2 hover:bg-red-50 hover:text-red-600 border-surface-tertiary">
                       <Trash2 className="w-4 h-4" />
                     </button>
                   </div>
                 </div>

                 <div className="space-y-2 mt-4 border-t border-surface-tertiary pt-4">
                   <p className="text-xs font-bold text-ink-tertiary mb-2 uppercase">Stats</p>
                   {(poll.poll_options || []).map(opt => {
                     const totalVotes = (poll.poll_options || []).reduce((sum, o) => sum + (o.votes || 0), 0);
                     const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
                     return (
                       <div key={opt.id} className="relative">
                         <div className="flex justify-between text-sm font-medium mb-1 relative z-10 px-3 py-1">
                            <span>{opt.option_text}</span>
                            <span className="text-ink-secondary">{opt.votes} votes ({percent}%)</span>
                         </div>
                         <div className="absolute inset-0 bg-surface-secondary rounded-lg overflow-hidden">
                            <div className="h-full bg-brand-100/50" style={{ width: `${percent}%` }}></div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
}
