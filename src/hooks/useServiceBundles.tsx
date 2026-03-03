import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface BundleItem {
  id: string;
  service_id: string;
  sort_order: number;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    description: string | null;
    category: string | null;
  };
}

export interface ServiceBundle {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
  created_at: string;
  items: BundleItem[];
  // Computed
  original_total: number;
  discount_amount: number;
  final_total: number;
  total_duration: number;
}

export const useServiceBundles = (businessId: string | undefined) => {
  const [bundles, setBundles] = useState<ServiceBundle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBundles = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: bundlesData, error: bundlesError } = await supabase
        .from('service_bundles')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (bundlesError) throw bundlesError;
      if (!bundlesData || bundlesData.length === 0) {
        setBundles([]);
        setLoading(false);
        return;
      }

      const bundleIds = bundlesData.map(b => b.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from('bundle_items')
        .select('*, services(id, name, duration, price, description, category)')
        .in('bundle_id', bundleIds)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      const result: ServiceBundle[] = bundlesData.map(bundle => {
        const items: BundleItem[] = (itemsData || [])
          .filter((item: any) => item.bundle_id === bundle.id && item.services)
          .map((item: any) => ({
            id: item.id,
            service_id: item.service_id,
            sort_order: item.sort_order,
            service: item.services,
          }));

        const originalTotal = items.reduce((sum, item) => sum + Number(item.service.price), 0);
        const discountAmount = bundle.discount_type === 'percentage'
          ? originalTotal * (Number(bundle.discount_value) / 100)
          : Number(bundle.discount_value);
        const finalTotal = Math.max(0, originalTotal - discountAmount);
        const totalDuration = items.reduce((sum, item) => sum + item.service.duration, 0);

        return {
          id: bundle.id,
          business_id: bundle.business_id,
          name: bundle.name,
          description: bundle.description,
          discount_type: bundle.discount_type,
          discount_value: Number(bundle.discount_value),
          is_active: bundle.is_active ?? true,
          created_at: bundle.created_at,
          items,
          original_total: originalTotal,
          discount_amount: discountAmount,
          final_total: finalTotal,
          total_duration: totalDuration,
        };
      });

      setBundles(result.filter(b => b.items.length > 0));
    } catch (err) {
      console.error('Failed to fetch bundles', err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  return { bundles, loading, refetch: fetchBundles };
};

// Hook for business owners to manage their bundles
export const useManageBundles = (businessId: string | undefined) => {
  const { toast } = useToast();
  const { bundles, loading, refetch } = useServiceBundles(businessId);

  const createBundle = async (data: {
    name: string;
    description: string;
    discount_type: string;
    discount_value: number;
    service_ids: string[];
  }) => {
    if (!businessId) return false;
    try {
      const { data: bundle, error } = await supabase
        .from('service_bundles')
        .insert({
          business_id: businessId,
          name: data.name,
          description: data.description,
          discount_type: data.discount_type,
          discount_value: data.discount_value,
        })
        .select()
        .single();

      if (error) throw error;

      const items = data.service_ids.map((sid, i) => ({
        bundle_id: bundle.id,
        service_id: sid,
        sort_order: i,
      }));

      const { error: itemsError } = await supabase.from('bundle_items').insert(items);
      if (itemsError) throw itemsError;

      toast({ title: 'Bundle created!' });
      refetch();
      return true;
    } catch (err) {
      console.error('Failed to create bundle', err);
      toast({ title: 'Failed to create bundle', variant: 'destructive' });
      return false;
    }
  };

  const deleteBundle = async (bundleId: string) => {
    try {
      const { error } = await supabase
        .from('service_bundles')
        .update({ is_active: false })
        .eq('id', bundleId);
      if (error) throw error;
      toast({ title: 'Bundle removed' });
      refetch();
      return true;
    } catch {
      toast({ title: 'Failed to remove bundle', variant: 'destructive' });
      return false;
    }
  };

  return { bundles, loading, createBundle, deleteBundle, refetch };
};
