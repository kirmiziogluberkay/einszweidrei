'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function QuestionOfTheDay() {
  const supabase = createClient();
  const [poll, setPoll] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePoll();
  }, []);

  const fetchActivePoll = async () => {
    setLoading(true);

    // Check global polls toggle first
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'polls_enabled')
      .single();

    if (setting?.value !== 'true') {
      setLoading(false);
      return; // polls turned off globally — render nothing
    }

    // Fetch the only active poll
    const { data: pollData, error } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!error && pollData) {
      // local storage check
      const votedKey = `voted_poll_${pollData.id}`;
      if (localStorage.getItem(votedKey)) {
        setHasVoted(true);
      }
      setPoll(pollData);
    }
    setLoading(false);
  };

  const handleVote = async (optionId) => {
    if (!poll || hasVoted) return;

    // Optimistic UI Update Let's instantly show the stats. Add vote to local state.
    const updatedOptions = poll.poll_options.map(opt => {
      if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
      return opt;
    });
    setPoll({ ...poll, poll_options: updatedOptions });
    setHasVoted(true);
    localStorage.setItem(`voted_poll_${poll.id}`, 'true');

    // Make RPC call
    await supabase.rpc('increment_poll_vote', { opt_id: optionId });
  };

  if (loading) return null; // Or a gentle skeleton
  if (!poll) return null; // No active poll

  const optionsList = poll.poll_options || [];
  const totalVotes = optionsList.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return (
    <div className="card border-brand-200 bg-brand-50/20 shadow-sm relative overflow-hidden p-0">
      <div className="bg-brand-500 py-2 px-4 text-white flex items-center justify-between">
        <h3 className="font-bold text-xs tracking-wide flex items-center gap-1.5"><span className="text-sm">💡</span> Question of the Week</h3>
        <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Survey</span>
      </div>

      <div className="p-4">
        <p className="text-ink font-semibold text-base leading-snug mb-3.5">
          {poll.question}
        </p>

        <div className="flex flex-wrap gap-2">
          {optionsList.map(opt => {
            const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);

            if (hasVoted) {
              // Show Statistical View
              return (
                <div key={opt.id} className="relative h-8 flex-1 min-w-[120px] bg-surface-secondary rounded-lg overflow-hidden border border-surface-tertiary">
                  <div className="absolute top-0 left-0 h-full bg-brand-100 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-between px-3 text-xs">
                    <span className="font-medium text-ink truncate mr-2">{opt.option_text}</span>
                    <span className="font-bold text-brand-700 tabular-nums">{percent}%</span>
                  </div>
                </div>
              );
            } else {
              // Show Answer Options
              return (
                <button
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  className="flex-1 min-w-[120px] text-center justify-center p-2.5 rounded-lg border border-surface-tertiary hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors bg-white font-medium text-xs text-ink group"
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-surface-tertiary group-hover:border-brand-500 shrink-0" />
                    <span className="truncate">{opt.option_text}</span>
                  </div>
                </button>
              );
            }
          })}
        </div>

        {hasVoted && (
          <p className="text-xs text-ink-secondary text-right mt-3 font-medium">
            Based on {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </p>
        )}
      </div>
    </div>
  );
}
