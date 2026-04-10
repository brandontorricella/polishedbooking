import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GivingCause {
  id: string;
  name: string;
  description: string | null;
  organization: string | null;
  website_url: string | null;
  logo_url: string | null;
  votes: number;
  amount_donated: number;
  is_current: boolean;
}

export const GivesBackSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentCause, setCurrentCause] = useState<GivingCause | null>(null);
  const [votingCauses, setVotingCauses] = useState<GivingCause[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [userVotedId, setUserVotedId] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long' });

  useEffect(() => {
    loadGivingData();
  }, [user]);

  async function loadGivingData() {
    // Current cause
    const { data: current } = await supabase
      .from('giving_causes')
      .select('*')
      .eq('is_current', true)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear())
      .maybeSingle();
    
    if (current) setCurrentCause(current as any);

    // Voting candidates for next month
    const nextM = now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2;
    const nextY = now.getMonth() + 2 > 12 ? now.getFullYear() + 1 : now.getFullYear();
    const { data: candidates } = await supabase
      .from('giving_causes')
      .select('*')
      .eq('is_current', false)
      .eq('is_active', true)
      .eq('month', nextM)
      .eq('year', nextY)
      .order('votes', { ascending: false });

    if (candidates) setVotingCauses(candidates as any[]);

    // Total donated
    const { data: donations } = await supabase
      .from('donation_records')
      .select('donation_amount');
    if (donations) {
      setTotalDonated(donations.reduce((s, d) => s + Number(d.donation_amount), 0));
    }

    // User vote
    if (user) {
      const { data: vote } = await supabase
        .from('cause_votes')
        .select('cause_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (vote) setUserVotedId(vote.cause_id);
    }
  }

  async function handleVote(causeId: string) {
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    setVoting(true);
    const { error } = await supabase
      .from('cause_votes')
      .insert({ cause_id: causeId, user_id: user.id });
    
    if (!error) {
      setUserVotedId(causeId);
      setVotingCauses(prev => prev.map(c =>
        c.id === causeId ? { ...c, votes: c.votes + 1 } : c
      ));
      toast({ title: 'Vote cast! 💝', description: 'Thank you for making a difference.' });
    } else if (error.code === '23505') {
      toast({ title: 'Already voted', description: 'You can only vote once per month.', variant: 'destructive' });
    }
    setVoting(false);
  }

  const totalVotes = votingCauses.reduce((s, c) => s + c.votes, 0);

  // If no data at all, show a static version
  const hasData = currentCause || votingCauses.length > 0;

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-[hsl(240,40%,6%)] via-[hsl(280,30%,8%)] to-[hsl(210,40%,7%)]">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-primary bg-primary/15 border border-primary/30 mb-4">
            💝 Polished Gives Back
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
            1% of Every Subscription Goes to Our Community
          </h2>
          <p className="text-white/60 max-w-lg mx-auto leading-relaxed mb-6">
            Every month, 1% of Polished subscription revenue is donated to a cause
            chosen by our community. You vote, we give.
          </p>
          {totalDonated > 0 && (
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/[0.08] border border-white/15 rounded-full text-white/80 text-sm">
              Total donated so far:
              <span className="text-xl font-extrabold text-primary">${totalDonated.toFixed(0)}</span>
            </div>
          )}
        </motion.div>

        {/* Current month's cause */}
        {currentCause && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white/[0.06] border border-white/12 rounded-2xl p-6 mb-8"
          >
            <p className="text-sm font-bold text-yellow-400 mb-4">🌟 {monthName}'s Cause</p>
            <div className="flex gap-5 items-start flex-wrap">
              {currentCause.logo_url && (
                <img src={currentCause.logo_url} alt="" className="w-16 h-16 object-contain rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-lg font-bold text-white mb-1">{currentCause.name}</h3>
                {currentCause.organization && <p className="text-xs text-white/50 mb-2">{currentCause.organization}</p>}
                {currentCause.description && <p className="text-sm text-white/75 leading-relaxed mb-2">{currentCause.description}</p>}
                {currentCause.website_url && (
                  <a href={currentCause.website_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-semibold hover:underline">
                    Learn more →
                  </a>
                )}
              </div>
              <div className="text-center flex-shrink-0">
                <span className="block text-3xl font-black text-primary">${currentCause.amount_donated?.toFixed(0) || '0'}</span>
                <span className="block text-xs text-white/50 mt-1">donated this month</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Voting */}
        {votingCauses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-xl font-bold text-white mb-1.5">Vote for {nextMonthName}'s Cause</h3>
            <p className="text-sm text-white/60 mb-5">
              The cause with the most votes at the end of the month receives next month's donation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {votingCauses.map(cause => {
                const isVoted = userVotedId === cause.id;
                const votePct = totalVotes > 0 ? Math.round((cause.votes / totalVotes) * 100) : 0;
                return (
                  <div
                    key={cause.id}
                    className={`rounded-xl p-4 border transition-all ${
                      isVoted
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/[0.05]'
                    }`}
                  >
                    <h4 className="text-sm font-bold text-white mb-0.5">{cause.name}</h4>
                    {cause.organization && <p className="text-[11px] text-white/45 mb-1.5">{cause.organization}</p>}
                    {cause.description && <p className="text-xs text-white/60 leading-relaxed mb-3">{cause.description}</p>}
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${votePct}%` }} />
                      </div>
                      <span className="text-xs text-white/60 min-w-[30px] text-right">{votePct}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-white/45">{cause.votes} votes</span>
                      {!userVotedId ? (
                        <button
                          onClick={() => handleVote(cause.id)}
                          disabled={voting}
                          className="px-3.5 py-1.5 bg-primary text-white border-none rounded-md text-xs font-bold cursor-pointer hover:bg-primary/80 transition-colors disabled:opacity-50"
                        >
                          {voting ? '...' : 'Vote →'}
                        </button>
                      ) : isVoted ? (
                        <span className="text-xs text-primary font-semibold">✅ Your vote</span>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {!user && (
              <p className="text-sm text-white/50 text-center">
                <button onClick={() => navigate('/auth?mode=signup')} className="text-primary font-semibold bg-transparent border-none cursor-pointer hover:underline">
                  Sign in
                </button>{' '}to cast your vote
              </p>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-white/50 mb-4">
            As Polished grows, so does our giving. We're committed to increasing our donation percentage as we scale.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/gives-back')}
            className="bg-transparent border-white/30 text-white/80 hover:border-white hover:text-white hover:bg-white/5"
          >
            Learn about our giving program →
          </Button>
        </div>
      </div>
    </section>
  );
};
