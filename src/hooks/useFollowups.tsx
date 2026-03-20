import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FollowupSettings {
  id?: string;
  business_id: string;
  is_enabled: boolean;
  days_after_appointment: number;
  followup_message: string;
  include_discount: boolean;
  discount_percent: number;
  discount_valid_days: number;
}

export interface FollowupLog {
  id: string;
  business_id: string;
  user_id: string;
  booking_id: string | null;
  sent_at: string;
  message_type: string;
  discount_code: string | null;
  discount_used: boolean;
  rebooked: boolean;
  rebooked_at: string | null;
  client_name?: string;
  client_email?: string;
}

const DEFAULT_SETTINGS: Omit<FollowupSettings, 'business_id'> = {
  is_enabled: false,
  days_after_appointment: 14,
  followup_message: "Hi {client_name}! It's been a while since your last visit. We'd love to see you again! Book your next appointment today.",
  include_discount: false,
  discount_percent: 10,
  discount_valid_days: 7,
};

export function useFollowupSettings(businessId: string) {
  const [settings, setSettings] = useState<FollowupSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('followup_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching followup settings:', error);
    }

    if (data) {
      setSettings(data as unknown as FollowupSettings);
    } else {
      setSettings({ ...DEFAULT_SETTINGS, business_id: businessId });
    }
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (updated: FollowupSettings) => {
    setSaving(true);
    try {
      if (updated.id) {
        const { error } = await supabase
          .from('followup_settings')
          .update({
            is_enabled: updated.is_enabled,
            days_after_appointment: updated.days_after_appointment,
            followup_message: updated.followup_message,
            include_discount: updated.include_discount,
            discount_percent: updated.discount_percent,
            discount_valid_days: updated.discount_valid_days,
            updated_at: new Date().toISOString(),
          })
          .eq('id', updated.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('followup_settings')
          .insert({
            business_id: businessId,
            is_enabled: updated.is_enabled,
            days_after_appointment: updated.days_after_appointment,
            followup_message: updated.followup_message,
            include_discount: updated.include_discount,
            discount_percent: updated.discount_percent,
            discount_valid_days: updated.discount_valid_days,
          })
          .select()
          .single();
        if (error) throw error;
        setSettings(data as unknown as FollowupSettings);
      }
      toast({ title: 'Settings saved', description: 'Follow-up settings updated successfully.' });
      await fetchSettings();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return { settings, loading, saving, saveSettings, setSettings };
}

export function useFollowupStats(businessId: string) {
  const [stats, setStats] = useState({
    totalSent: 0,
    totalRebooked: 0,
    rebookRate: '0',
    discountsUsed: 0,
  });
  const [recentLogs, setRecentLogs] = useState<FollowupLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);

    const { data: logs } = await supabase
      .from('followup_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('sent_at', { ascending: false });

    const allLogs = (logs || []) as unknown as FollowupLog[];
    const totalSent = allLogs.length;
    const totalRebooked = allLogs.filter(l => l.rebooked).length;
    const discountsUsed = allLogs.filter(l => l.discount_used).length;
    const rebookRate = totalSent > 0 ? (totalRebooked / totalSent * 100).toFixed(1) : '0';

    setStats({ totalSent, totalRebooked, rebookRate, discountsUsed });

    // Enrich recent logs with profile data
    const recent = allLogs.slice(0, 20);
    if (recent.length > 0) {
      const userIds = [...new Set(recent.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const enriched = recent.map(l => ({
        ...l,
        client_name: profileMap.get(l.user_id)?.display_name || 'Unknown',
        client_email: profileMap.get(l.user_id)?.email || '',
      }));
      setRecentLogs(enriched);
    } else {
      setRecentLogs([]);
    }

    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, recentLogs, loading, refetch: fetchStats };
}
