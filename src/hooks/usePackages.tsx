import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { toast } from 'sonner';

export interface ServicePackage {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  service_ids: string[];
  session_count: number;
  price: number;
  original_price: number | null;
  validity_days: number;
  is_active: boolean;
  created_at: string;
}

export interface ClientPackage {
  id: string;
  package_id: string;
  user_id: string;
  business_id: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  purchase_price: number;
  purchased_at: string;
  expires_at: string | null;
  is_active: boolean;
  package?: ServicePackage;
}

export function usePackages(businessId?: string) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { businessId: ownerBusinessId } = useAccountType();

  const fetchPackages = async () => {
    if (!businessId && !ownerBusinessId) { setLoading(false); return; }
    const targetId = businessId || ownerBusinessId;
    const { data, error } = await supabase
      .from('service_packages')
      .select('*')
      .eq('business_id', targetId!)
      .order('created_at', { ascending: false });
    if (!error && data) setPackages(data as unknown as ServicePackage[]);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, [businessId, ownerBusinessId]);

  const createPackage = async (pkg: Omit<ServicePackage, 'id' | 'created_at' | 'is_active' | 'business_id'>) => {
    if (!ownerBusinessId) return;
    const { error } = await supabase.from('service_packages').insert({
      ...pkg,
      business_id: ownerBusinessId,
    } as any);
    if (error) { toast.error('Failed to create package'); return; }
    toast.success('Package created');
    fetchPackages();
  };

  const updatePackage = async (id: string, updates: Partial<ServicePackage>) => {
    const { error } = await supabase.from('service_packages').update(updates as any).eq('id', id);
    if (error) { toast.error('Failed to update package'); return; }
    toast.success('Package updated');
    fetchPackages();
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase.from('service_packages').delete().eq('id', id);
    if (error) { toast.error('Failed to delete package'); return; }
    toast.success('Package deleted');
    fetchPackages();
  };

  return { packages, loading, fetchPackages, createPackage, updatePackage, deletePackage };
}

export function useClientPackages() {
  const [clientPackages, setClientPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data, error } = await supabase
        .from('client_packages')
        .select('*, package:service_packages(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('purchased_at', { ascending: false });
      if (!error && data) setClientPackages(data as unknown as ClientPackage[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return { clientPackages, loading };
}
