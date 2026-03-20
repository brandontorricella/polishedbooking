import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface WaitlistEntry {
  id: string;
  business_id: string;
  user_id: string;
  service_id: string | null;
  preferred_date: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  flexible_dates: boolean;
  status: string;
  notified_at: string | null;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
  // Joined fields
  business_name?: string;
  business_photo?: string | null;
  service_name?: string | null;
  client_name?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
}

export interface WaitlistNotification {
  id: string;
  waitlist_entry_id: string;
  available_date: string;
  available_time: string;
  response: string;
  responded_at: string | null;
  created_at: string;
}

// Client-side hook
export function useClientWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMyEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['waiting', 'notified'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with business/service names
      const enriched: WaitlistEntry[] = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: biz } = await supabase
            .from('businesses')
            .select('name, profile_photo_url')
            .eq('id', entry.business_id)
            .single();

          let serviceName: string | null = null;
          if (entry.service_id) {
            const { data: svc } = await supabase
              .from('services')
              .select('name')
              .eq('id', entry.service_id)
              .single();
            serviceName = svc?.name || null;
          }

          return {
            ...entry,
            flexible_dates: entry.flexible_dates ?? true,
            business_name: biz?.name || 'Unknown',
            business_photo: biz?.profile_photo_url || null,
            service_name: serviceName,
          };
        })
      );

      setEntries(enriched);
    } catch (err) {
      console.error('Error fetching waitlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const joinWaitlist = useCallback(async (params: {
    business_id: string;
    service_id?: string | null;
    preferred_date?: string | null;
    preferred_time_start?: string;
    preferred_time_end?: string;
    flexible_dates?: boolean;
    notes?: string;
  }) => {
    if (!user) return false;

    // Check for existing entry
    const { data: existing } = await supabase
      .from('waitlist_entries')
      .select('id')
      .eq('business_id', params.business_id)
      .eq('user_id', user.id)
      .eq('status', 'waiting')
      .maybeSingle();

    if (existing) {
      toast({ title: 'Already on waitlist', description: 'You\'re already waiting for this business', variant: 'destructive' });
      return false;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase.from('waitlist_entries').insert({
      business_id: params.business_id,
      user_id: user.id,
      service_id: params.service_id || null,
      preferred_date: params.preferred_date || null,
      preferred_time_start: params.preferred_time_start || null,
      preferred_time_end: params.preferred_time_end || null,
      flexible_dates: params.flexible_dates !== false,
      notes: params.notes || null,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to join waitlist', variant: 'destructive' });
      return false;
    }

    toast({ title: 'Added to waitlist! ⏳', description: 'We\'ll notify you when a spot opens' });
    return true;
  }, [user, toast]);

  const leaveWaitlist = useCallback(async (entryId: string) => {
    const { error } = await supabase
      .from('waitlist_entries')
      .update({ status: 'canceled' })
      .eq('id', entryId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to leave waitlist', variant: 'destructive' });
      return false;
    }

    setEntries(prev => prev.filter(e => e.id !== entryId));
    toast({ title: 'Removed from waitlist' });
    return true;
  }, [toast]);

  return { entries, loading, fetchMyEntries, joinWaitlist, leaveWaitlist };
}

// Business-side hook
export function useBusinessWaitlist(businessId: string | null) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWaitlist = useCallback(async (filters?: { status?: string; service_id?: string }) => {
    if (!businessId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('waitlist_entries')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'waiting');
      }

      if (filters?.service_id) {
        query = query.eq('service_id', filters.service_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Enrich with client info and service names
      const enriched: WaitlistEntry[] = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email, phone')
            .eq('user_id', entry.user_id)
            .single();

          let serviceName: string | null = null;
          if (entry.service_id) {
            const { data: svc } = await supabase
              .from('services')
              .select('name')
              .eq('id', entry.service_id)
              .single();
            serviceName = svc?.name || null;
          }

          return {
            ...entry,
            flexible_dates: entry.flexible_dates ?? true,
            client_name: profile?.display_name || profile?.email || 'Unknown',
            client_email: profile?.email || null,
            client_phone: profile?.phone || null,
            service_name: serviceName,
          };
        })
      );

      setEntries(enriched);
    } catch (err) {
      console.error('Error fetching business waitlist:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const notifyClient = useCallback(async (entryId: string, availableDate: string, availableTime: string) => {
    if (!businessId) return false;

    // Create notification
    const { error: notifError } = await supabase.from('waitlist_notifications').insert({
      waitlist_entry_id: entryId,
      available_date: availableDate,
      available_time: availableTime,
    });

    if (notifError) {
      toast({ title: 'Error', description: 'Failed to create notification', variant: 'destructive' });
      return false;
    }

    // Update entry status
    const { error: updateError } = await supabase
      .from('waitlist_entries')
      .update({ status: 'notified', notified_at: new Date().toISOString() })
      .eq('id', entryId);

    if (updateError) {
      toast({ title: 'Error', description: 'Failed to update entry', variant: 'destructive' });
      return false;
    }

    // Create in-app notification for the client
    const entry = entries.find(e => e.id === entryId);
    if (entry) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single();

      await supabase.from('notifications').insert({
        user_id: entry.user_id,
        title: 'Spot Available! 🎉',
        message: `A spot opened at ${biz?.name || 'your favorite business'} on ${new Date(availableDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })} at ${availableTime}`,
        type: 'waitlist',
        data: { waitlist_entry_id: entryId, business_id: businessId },
      });
    }

    toast({ title: 'Client notified! 🔔' });
    return true;
  }, [businessId, entries, toast]);

  return { entries, loading, fetchWaitlist, notifyClient };
}
