import { useState, useEffect } from 'react';
import { Users, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Enrollment {
  id: string;
  status: string;
  session_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  schedule_name: string;
  business_name: string;
  business_id: string;
  is_virtual: boolean;
  virtual_link: string | null;
  duration_minutes: number;
}

export const MyClassesTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchEnrollments = async () => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select(`
          id, status, session_id,
          session:class_sessions(
            session_date, start_time, end_time, business_id,
            schedule:class_schedules(name, duration_minutes, is_virtual, virtual_link, business_id)
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['enrolled', 'waitlisted', 'attended'])
        .order('enrolled_at', { ascending: false });

      if (error) { console.error(error); setLoading(false); return; }

      // Gather business IDs for names
      const businessIds = [...new Set((data || []).map((e: any) => e.session?.schedule?.business_id).filter(Boolean))];
      let businessMap: Record<string, string> = {};
      if (businessIds.length > 0) {
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, name')
          .in('id', businessIds);
        if (businesses) businesses.forEach(b => { businessMap[b.id] = b.name; });
      }

      setEnrollments((data || []).map((e: any) => ({
        id: e.id,
        status: e.status || 'enrolled',
        session_id: e.session_id,
        session_date: e.session?.session_date || '',
        start_time: e.session?.start_time || '',
        end_time: e.session?.end_time || '',
        schedule_name: e.session?.schedule?.name || 'Class',
        business_name: businessMap[e.session?.schedule?.business_id] || '',
        business_id: e.session?.schedule?.business_id || '',
        is_virtual: e.session?.schedule?.is_virtual ?? false,
        virtual_link: e.session?.schedule?.virtual_link || null,
        duration_minutes: e.session?.schedule?.duration_minutes || 0,
      })));
      setLoading(false);
    };

    fetchEnrollments();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const now = new Date();
  const upcoming = enrollments.filter(e => new Date(`${e.session_date}T${e.start_time}`) > now);
  const past = enrollments.filter(e => new Date(`${e.session_date}T${e.start_time}`) <= now);

  const formatTime = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const statusVariant = (status: string) => {
    switch (status) {
      case 'enrolled': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'waitlisted': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'attended': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-display text-xl font-semibold mb-2">No class enrollments yet</h3>
        <p className="text-muted-foreground mb-6">Find a class you love!</p>
        <Button className="bg-gradient-primary" onClick={() => navigate('/search')}>
          Browse Classes
        </Button>
      </div>
    );
  }

  const renderCard = (e: Enrollment, isPast: boolean) => (
    <div key={e.id} className={cn("flex items-center justify-between p-4 rounded-xl border border-border bg-card", isPast && "opacity-70")}>
      <div className="min-w-0 flex-1">
        <h4 className="font-medium truncate">{e.schedule_name}</h4>
        {e.business_name && <p className="text-sm text-muted-foreground">{e.business_name}</p>}
        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
          <span>📅 {new Date(e.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span>🕐 {formatTime(e.start_time)}</span>
        </div>
        {e.is_virtual && e.virtual_link && !isPast && (
          <a href={e.virtual_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-1">
            <ExternalLink className="w-3 h-3" /> Join Class Online
          </a>
        )}
      </div>
      <Badge className={statusVariant(e.status)}>{e.status}</Badge>
    </div>
  );

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Upcoming Classes</h3>
          {upcoming.map(e => renderCard(e, false))}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Past Classes</h3>
          {past.map(e => renderCard(e, true))}
        </div>
      )}
    </div>
  );
};
