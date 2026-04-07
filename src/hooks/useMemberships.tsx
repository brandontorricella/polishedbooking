import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';

export interface BusinessMembership {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price: number;
  sessions_per_period: number | null;
  service_ids: string[];
  perks: string[];
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ClientMembership {
  id: string;
  membership_id: string;
  user_id: string;
  business_id: string;
  status: string;
  sessions_used_this_period: number;
  current_period_start: string | null;
  current_period_end: string | null;
  started_at: string;
  canceled_at: string | null;
  membership?: BusinessMembership;
}

export function useMemberships(businessId?: string) {
  const [memberships, setMemberships] = useState<BusinessMembership[]>([]);
  const [clientMemberships, setClientMemberships] = useState<ClientMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const { businessId: ownerBusinessId } = useAccountType();

  const targetId = businessId || ownerBusinessId;

  const fetchMemberships = async () => {
    if (!targetId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('business_memberships')
      .select('*')
      .eq('business_id', targetId)
      .order('created_at', { ascending: false });
    if (!error && data) setMemberships(data as unknown as BusinessMembership[]);
    setLoading(false);
  };

  const fetchClientMemberships = async () => {
    if (!targetId) return;
    const { data, error } = await supabase
      .from('client_memberships')
      .select('*, membership:business_memberships(*)')
      .eq('business_id', targetId)
      .order('started_at', { ascending: false });
    if (!error && data) setClientMemberships(data as unknown as ClientMembership[]);
  };

  useEffect(() => {
    fetchMemberships();
    fetchClientMemberships();
  }, [targetId]);

  const createMembership = async (m: Omit<BusinessMembership, 'id' | 'created_at' | 'is_active' | 'business_id' | 'stripe_price_id'>) => {
    if (!ownerBusinessId) return;
    const { error } = await supabase.from('business_memberships').insert({
      ...m,
      business_id: ownerBusinessId,
    } as any);
    if (error) { toast.error('Failed to create membership'); return; }
    toast.success('Membership plan created');
    fetchMemberships();
  };

  const updateMembership = async (id: string, updates: Partial<BusinessMembership>) => {
    const { error } = await supabase.from('business_memberships').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Updated');
    fetchMemberships();
  };

  const cancelClientMembership = async (id: string) => {
    const { error } = await supabase.from('client_memberships')
      .update({ status: 'canceled', canceled_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) { toast.error('Failed to cancel'); return; }
    toast.success('Membership canceled');
    fetchClientMemberships();
  };

  return { memberships, clientMemberships, loading, createMembership, updateMembership, cancelClientMembership, fetchMemberships, fetchClientMemberships };
}
