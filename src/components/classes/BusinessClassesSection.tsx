import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClassSessionWithSchedule {
  id: string;
  schedule_id: string;
  business_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  is_canceled: boolean;
  schedule: {
    name: string;
    description: string | null;
    duration_minutes: number;
    capacity: number;
    price: number;
    is_free: boolean;
    is_virtual: boolean;
    virtual_link: string | null;
    category: string | null;
    instructor_id: string | null;
  } | null;
  user_enrolled?: boolean;
  user_waitlisted?: boolean;
}

interface Props {
  businessId: string;
}

export const BusinessClassesSection = ({ businessId }: Props) => {
  const { user } = useAuth();
  const { accountType } = useAccountType();
  const [sessions, setSessions] = useState<ClassSessionWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'today' | 'this_week'>('upcoming');
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('class_sessions')
      .select('*, schedule:class_schedules(*)')
      .eq('business_id', businessId)
      .eq('is_canceled', false)
      .order('session_date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(20);

    if (filter === 'today') {
      query = query.eq('session_date', today);
    } else if (filter === 'this_week') {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 7);
      query = query.gte('session_date', today).lte('session_date', weekEnd.toISOString().split('T')[0]);
    } else {
      query = query.gte('session_date', today);
    }

    const { data, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    let userEnrollments: Record<string, string> = {};
    if (user) {
      const sessionIds = (data || []).map(s => s.id);
      if (sessionIds.length > 0) {
        const { data: enrollData } = await supabase
          .from('class_enrollments')
          .select('session_id, status')
          .eq('user_id', user.id)
          .in('session_id', sessionIds)
          .in('status', ['enrolled', 'waitlisted']);
        if (enrollData) {
          enrollData.forEach(e => { userEnrollments[e.session_id] = e.status || 'enrolled'; });
        }
      }
    }

    setSessions((data || []).map(s => ({
      ...s,
      enrolled_count: s.enrolled_count ?? 0,
      is_canceled: s.is_canceled ?? false,
      schedule: s.schedule as any,
      user_enrolled: userEnrollments[s.id] === 'enrolled',
      user_waitlisted: userEnrollments[s.id] === 'waitlisted',
    })));
    setLoading(false);
  }, [businessId, filter, user]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleEnroll = async (session: ClassSessionWithSchedule) => {
    if (!user || accountType === 'guest') {
      toast.error('Sign in to join this class');
      return;
    }
    setEnrollingId(session.id);

    const spotsLeft = session.capacity - session.enrolled_count;
    const isFull = spotsLeft <= 0;

    if (isFull) {
      // Waitlist
      const { error } = await supabase.from('class_enrollments').upsert({
        session_id: session.id,
        user_id: user.id,
        business_id: session.business_id,
        status: 'waitlisted',
      }, { onConflict: 'session_id,user_id' });
      if (error) { toast.error(error.message); } else {
        toast.success('Added to waitlist!');
        await fetchSessions();
      }
    } else if (session.schedule?.is_free || (session.schedule?.price ?? 0) === 0) {
      // Free class - enroll directly
      const { error: enrollError } = await supabase.from('class_enrollments').upsert({
        session_id: session.id,
        user_id: user.id,
        business_id: session.business_id,
        status: 'enrolled',
        amount_paid: 0,
      }, { onConflict: 'session_id,user_id' });
      if (enrollError) { toast.error(enrollError.message); setEnrollingId(null); return; }

      await supabase.from('class_sessions').update({
        enrolled_count: session.enrolled_count + 1
      }).eq('id', session.id);

      toast.success("You're enrolled! See you in class 🎉");
      await fetchSessions();
    } else {
      // Paid class - for now enroll directly (Stripe integration would go here)
      const { error: enrollError } = await supabase.from('class_enrollments').upsert({
        session_id: session.id,
        user_id: user.id,
        business_id: session.business_id,
        status: 'enrolled',
        amount_paid: session.schedule?.price ?? 0,
      }, { onConflict: 'session_id,user_id' });
      if (enrollError) { toast.error(enrollError.message); setEnrollingId(null); return; }

      await supabase.from('class_sessions').update({
        enrolled_count: session.enrolled_count + 1
      }).eq('id', session.id);

      toast.success("You're enrolled! See you in class 🎉");
      await fetchSessions();
    }
    setEnrollingId(null);
  };

  const handleCancelEnrollment = async (session: ClassSessionWithSchedule) => {
    if (!user) return;
    const { error } = await supabase.from('class_enrollments')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() })
      .eq('session_id', session.id)
      .eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }

    if (session.user_enrolled) {
      await supabase.from('class_sessions').update({
        enrolled_count: Math.max(0, session.enrolled_count - 1)
      }).eq('id', session.id);

      // Auto-promote from waitlist
      const { data: nextWaitlisted } = await supabase
        .from('class_enrollments')
        .select('id, user_id')
        .eq('session_id', session.id)
        .eq('status', 'waitlisted')
        .order('enrolled_at', { ascending: true })
        .limit(1);

      if (nextWaitlisted && nextWaitlisted.length > 0) {
        await supabase.from('class_enrollments')
          .update({ status: 'enrolled' })
          .eq('id', nextWaitlisted[0].id);
        // enrolled_count stays same since we decremented and now increment
        await supabase.from('class_sessions').update({
          enrolled_count: session.enrolled_count // back to original
        }).eq('id', session.id);
      }
    }

    toast.success('Your spot has been canceled');
    await fetchSessions();
  };

  if (!loading && sessions.length === 0 && filter === 'upcoming') return null;

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'today', label: 'Today' },
    { key: 'this_week', label: 'This Week' },
  ];

  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" /> Classes
      </h3>

      <div className="flex gap-2">
        {filters.map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No classes scheduled. Check back soon!</p>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const spotsLeft = session.capacity - session.enrolled_count;
            const isFull = spotsLeft <= 0;
            const fillPercent = (session.enrolled_count / session.capacity) * 100;

            return (
              <div key={session.id} className="flex justify-between items-center p-4 rounded-xl border border-border bg-card gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{session.schedule?.name}</h4>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                    <span>📅 {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span>🕐 {formatTime(session.start_time)}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {session.schedule?.duration_minutes} min</span>
                    {session.schedule?.is_virtual && <span className="flex items-center gap-0.5"><Monitor className="w-3 h-3" /> Virtual</span>}
                  </div>
                  <div className="mt-2 max-w-[200px]">
                    <Progress value={fillPercent} className="h-1" />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isFull ? '🔴 Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-lg font-bold">
                    {session.schedule?.is_free ? '🆓 Free' : `$${Number(session.schedule?.price ?? 0).toFixed(0)}`}
                  </span>

                  {session.user_enrolled ? (
                    <div className="text-right">
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">✅ Enrolled</Badge>
                      <button className="text-xs text-muted-foreground underline mt-1 block" onClick={() => handleCancelEnrollment(session)}>Cancel</button>
                    </div>
                  ) : session.user_waitlisted ? (
                    <div className="text-right">
                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">⏳ Waitlisted</Badge>
                      <button className="text-xs text-muted-foreground underline mt-1 block" onClick={() => handleCancelEnrollment(session)}>Leave</button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant={isFull ? 'outline' : 'default'}
                      disabled={enrollingId === session.id}
                      onClick={() => handleEnroll(session)}
                    >
                      {enrollingId === session.id ? 'Processing...' : isFull ? 'Join Waitlist' : 'Enroll'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
