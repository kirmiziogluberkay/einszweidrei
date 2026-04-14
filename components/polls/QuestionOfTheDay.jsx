'use client';

import { useState, useEffect } from 'react';

export default function QuestionOfTheDay() {
  const [poll,     setPoll]     = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function fetchActivePoll() {
      try {
        const res = await fetch('/api/polls');
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();

        if (!data.polls_enabled || !data.poll) { setLoading(false); return; }

        const p = data.poll;
        if (localStorage.getItem(`voted_poll_${p.id}`)) setHasVoted(true);
        setPoll(p);
      } catch { /* silent */ }
      setLoading(false);
    }
    fetchActivePoll();
  }, []);

  const handleVote = async (optionId) => {
    if (!poll || hasVoted) return;

    const updatedOptions = poll.poll_options.map(opt =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    setPoll({ ...poll, poll_options: updatedOptions });
    setHasVoted(true);
    localStorage.setItem(`voted_poll_${poll.id}`, 'true');

    await fetch(`/api/polls/${poll.id}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ optionId }),
    });
  };

  if (loading || !poll) return null;

  const optionsList = poll.poll_options || [];
  const totalVotes  = optionsList.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  return (
    <div className="card border-brand-200 bg-brand-50/20 shadow-sm relative overflow-hidden p-0">
      <div className="bg-brand-500 py-1.5 px-3 text-white flex items-center justify-between">
        <h3 className="font-bold text-xs tracking-wide flex items-center gap-1"><span className="text-xs">💡</span> Question of the Week</h3>
        <span className="text-[9px] uppercase font-bold tracking-widest opacity-80">Survey</span>
      </div>

      <div className="p-3">
        <p className="text-ink font-semibold text-sm leading-snug mb-2.5">{poll.question}</p>

        <div className="flex flex-wrap gap-1.5">
          {optionsList.map(opt => {
            const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);

            if (hasVoted) {
              return (
                <div key={opt.id} className="relative h-7 flex-1 min-w-[100px] bg-surface-secondary rounded-lg overflow-hidden border border-surface-tertiary">
                  <div className="absolute top-0 left-0 h-full bg-brand-100 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }} />
                  <div className="relative z-10 w-full h-full flex items-center justify-between px-2 text-xs">
                    <span className="font-medium text-ink truncate mr-2">{opt.option_text}</span>
                    <span className="font-bold text-brand-700 tabular-nums">{percent}%</span>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={opt.id}
                onClick={() => handleVote(opt.id)}
                className="flex-1 min-w-[100px] text-center justify-center p-2 rounded-lg border border-surface-tertiary hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-colors bg-white font-medium text-xs text-ink group"
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-surface-tertiary group-hover:border-brand-500 shrink-0" />
                  <span className="truncate">{opt.option_text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
