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
      <div className="bg-brand-500 py-3 px-5 text-white flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-wide">💡 Question of the Day</h3>
        <span className="text-[10px] uppercase font-bold tracking-widest opacity-80">Survey</span>
      </div>
      
      <div className="p-5">
         <p className="text-ink font-semibold text-lg leading-snug mb-5">
           {poll.question}
         </p>

         <div className="space-y-3">
           {optionsList.map(opt => {
             const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);

             if (hasVoted) {
                // Show Statistical View
                return (
                  <div key={opt.id} className="relative h-10 w-full bg-surface-secondary rounded-xl overflow-hidden border border-surface-tertiary">
                    <div className="absolute top-0 left-0 h-full bg-brand-100 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                    <div className="relative z-10 w-full h-full flex items-center justify-between px-4 text-sm">
                      <span className="font-medium text-ink truncate mr-3">{opt.option_text}</span>
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
                    className="w-full text-left p-3 rounded-xl border border-surface-tertiary hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors bg-white font-medium text-sm text-ink group"
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-4 h-4 rounded-full border-2 border-surface-tertiary group-hover:border-brand-500" />
                       {opt.option_text}
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
