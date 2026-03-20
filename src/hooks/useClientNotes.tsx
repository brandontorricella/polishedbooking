import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ClientSummary {
  id: string;
  display_name: string | null;
  email: string;
  profile_photo_url: string | null;
  total_bookings: number;
  last_booking_date: string | null;
  last_service_name: string | null;
  note_count: number;
}

export interface ClientNote {
  id: string;
  business_id: string;
  client_id: string;
  note_type: string;
  content: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientDetail {
  client: { id: string; display_name: string | null; email: string; profile_photo_url: string | null };
  notes: ClientNote[];
  preferences: Record<string, string>;
  bookingHistory: { id: string; booking_date: string; service_name: string; total_price: number; status: string }[];
  stats: { total_bookings: number; total_spent: number; client_since: string | null };
}

export function useClientList(businessId: string | null) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async (search?: string) => {
    if (!businessId) return;
    setLoading(true);
    try {
      // Get unique client IDs from bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('client_id')
        .eq('business_id', businessId);

      const uniqueIds = [...new Set((bookings || []).map(b => b.client_id))];
      if (uniqueIds.length === 0) { setClients([]); setLoading(false); return; }

      // Fetch profiles for these clients
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, email, profile_photo_url')
        .in('user_id', uniqueIds);

      const { data: profiles } = await query;

      // Filter by search if provided
      let filtered = profiles || [];
      if (search && search.trim()) {
        const s = search.toLowerCase();
        filtered = filtered.filter(p =>
          (p.display_name || '').toLowerCase().includes(s) ||
          p.email.toLowerCase().includes(s)
        );
      }

      // Get booking stats and note counts for each client
      const summaries: ClientSummary[] = await Promise.all(
        filtered.map(async (profile) => {
          const { data: clientBookings } = await supabase
            .from('bookings')
            .select('id, booking_date, service_id, status')
            .eq('business_id', businessId)
            .eq('client_id', profile.user_id)
            .order('booking_date', { ascending: false });

          const completed = (clientBookings || []).filter(b => b.status === 'completed');
          const lastBooking = clientBookings?.[0];

          let lastServiceName: string | null = null;
          if (lastBooking) {
            const { data: svc } = await supabase
              .from('services')
              .select('name')
              .eq('id', lastBooking.service_id)
              .single();
            lastServiceName = svc?.name || null;
          }

          const { count: noteCount } = await supabase
            .from('client_notes')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('client_id', profile.user_id);

          return {
            id: profile.user_id,
            display_name: profile.display_name,
            email: profile.email,
            profile_photo_url: profile.profile_photo_url,
            total_bookings: completed.length,
            last_booking_date: lastBooking?.booking_date || null,
            last_service_name: lastServiceName,
            note_count: noteCount || 0,
          };
        })
      );

      // Sort by last booking date (most recent first)
      summaries.sort((a, b) => {
        if (!a.last_booking_date) return 1;
        if (!b.last_booking_date) return -1;
        return b.last_booking_date.localeCompare(a.last_booking_date);
      });

      setClients(summaries);
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  return { clients, loading, fetchClients };
}

export function useClientDetail(businessId: string | null) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDetail = useCallback(async (clientId: string) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [notesRes, prefsRes, profileRes, bookingsRes] = await Promise.all([
        supabase
          .from('client_notes')
          .select('*')
          .eq('business_id', businessId)
          .eq('client_id', clientId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('client_preferences')
          .select('preference_key, preference_value')
          .eq('business_id', businessId)
          .eq('client_id', clientId),
        supabase
          .from('profiles')
          .select('user_id, display_name, email, profile_photo_url')
          .eq('user_id', clientId)
          .single(),
        supabase
          .from('bookings')
          .select('id, booking_date, service_id, total_price, status')
          .eq('business_id', businessId)
          .eq('client_id', clientId)
          .order('booking_date', { ascending: false })
          .limit(10),
      ]);

      // Get service names for bookings
      const serviceIds = [...new Set((bookingsRes.data || []).map(b => b.service_id))];
      const { data: services } = serviceIds.length > 0
        ? await supabase.from('services').select('id, name').in('id', serviceIds)
        : { data: [] };
      const serviceMap = Object.fromEntries((services || []).map(s => [s.id, s.name]));

      const bookingHistory = (bookingsRes.data || []).map(b => ({
        id: b.id,
        booking_date: b.booking_date,
        service_name: serviceMap[b.service_id] || 'Unknown',
        total_price: Number(b.total_price),
        status: b.status || 'pending',
      }));

      // Calculate stats
      const completedBookings = (bookingsRes.data || []).filter(b => b.status === 'completed');
      const totalSpent = completedBookings.reduce((s, b) => s + Number(b.total_price || 0), 0);

      // Get all bookings to find first one
      const { data: allBookings } = await supabase
        .from('bookings')
        .select('booking_date')
        .eq('business_id', businessId)
        .eq('client_id', clientId)
        .order('booking_date', { ascending: true })
        .limit(1);

      const preferences: Record<string, string> = {};
      (prefsRes.data || []).forEach(p => { preferences[p.preference_key] = p.preference_value; });

      const notes: ClientNote[] = (notesRes.data || []).map(n => ({
        id: n.id,
        business_id: n.business_id,
        client_id: n.client_id,
        note_type: n.note_type,
        content: n.content,
        is_pinned: n.is_pinned ?? false,
        created_by: n.created_by,
        created_at: n.created_at,
        updated_at: n.updated_at,
      }));

      setDetail({
        client: {
          id: profileRes.data?.user_id || clientId,
          display_name: profileRes.data?.display_name || null,
          email: profileRes.data?.email || '',
          profile_photo_url: profileRes.data?.profile_photo_url || null,
        },
        notes,
        preferences,
        bookingHistory,
        stats: {
          total_bookings: completedBookings.length,
          total_spent: totalSpent,
          client_since: allBookings?.[0]?.booking_date || null,
        },
      });
    } catch (err) {
      console.error('Error fetching client detail:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const addNote = useCallback(async (clientId: string, content: string, noteType: string, isPinned = false) => {
    if (!businessId || !user) return;
    const { error } = await supabase.from('client_notes').insert({
      business_id: businessId,
      client_id: clientId,
      content: content.trim(),
      note_type: noteType,
      is_pinned: isPinned,
      created_by: user.id,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
    } else {
      toast({ title: 'Note added' });
      await fetchDetail(clientId);
    }
  }, [businessId, user, toast, fetchDetail]);

  const updateNote = useCallback(async (clientId: string, noteId: string, updates: { content?: string; note_type?: string; is_pinned?: boolean }) => {
    if (!businessId) return;
    const { error } = await supabase.from('client_notes').update(updates).eq('id', noteId).eq('business_id', businessId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update note', variant: 'destructive' });
    } else {
      await fetchDetail(clientId);
    }
  }, [businessId, toast, fetchDetail]);

  const deleteNote = useCallback(async (clientId: string, noteId: string) => {
    if (!businessId) return;
    const { error } = await supabase.from('client_notes').delete().eq('id', noteId).eq('business_id', businessId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    } else {
      toast({ title: 'Note deleted' });
      await fetchDetail(clientId);
    }
  }, [businessId, toast, fetchDetail]);

  const savePreferences = useCallback(async (clientId: string, prefs: Record<string, string>) => {
    if (!businessId) return;
    try {
      for (const [key, value] of Object.entries(prefs)) {
        if (!value || value.trim() === '') {
          await supabase.from('client_preferences')
            .delete()
            .eq('business_id', businessId)
            .eq('client_id', clientId)
            .eq('preference_key', key);
        } else {
          // Upsert: try insert, on conflict update
          const { error: insertErr } = await supabase.from('client_preferences').upsert(
            { business_id: businessId, client_id: clientId, preference_key: key, preference_value: value.trim() },
            { onConflict: 'business_id,client_id,preference_key' }
          );
          if (insertErr) throw insertErr;
        }
      }
      toast({ title: 'Preferences saved' });
      await fetchDetail(clientId);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save preferences', variant: 'destructive' });
    }
  }, [businessId, toast, fetchDetail]);

  return { detail, loading, fetchDetail, addNote, updateNote, deleteNote, savePreferences };
}
