import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface PromotionWithBusiness {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  code: string | null;
  is_new_client_only: boolean | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  total_claimed: number | null;
  max_claims: number | null;
  business: {
    id: string;
    name: string;
    profile_photo_url: string | null;
    city: string | null;
    state: string | null;
  } | null;
}

export function usePromotions() {
  const [promotions, setPromotions] = useState<PromotionWithBusiness[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        business:businesses!promotions_business_id_fkey (
          id, name, profile_photo_url, city, state
        )
      `)
      .eq('is_active', true)
      .gte('end_date', now)
      .lte('start_date', now)
      .order('end_date', { ascending: true })
      .limit(10);

    if (!error && data) {
      setPromotions(data as unknown as PromotionWithBusiness[]);
    }
    setLoading(false);
  }, []);

  const fetchClaimedIds = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('promotion_claims')
      .select('promotion_id')
      .eq('user_id', user.id);

    if (data) {
      setClaimedIds(new Set(data.map(c => c.promotion_id)));
    }
  }, [user]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    fetchClaimedIds();
  }, [fetchClaimedIds]);

  const claimPromotion = async (promotionId: string, businessId: string) => {
    if (!user) {
      return { success: false, error: 'Please sign in to claim this offer' };
    }

    if (claimedIds.has(promotionId)) {
      return { success: false, error: 'You have already claimed this offer' };
    }

    const promo = promotions.find(p => p.id === promotionId);
    if (!promo) {
      return { success: false, error: 'Promotion not found' };
    }

    if (promo.max_claims && (promo.total_claimed || 0) >= promo.max_claims) {
      return { success: false, error: 'This offer is fully claimed' };
    }

    // Check new clients only
    if (promo.is_new_client_only) {
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .in('status', ['completed', 'confirmed'])
        .limit(1);

      if (existingBookings && existingBookings.length > 0) {
        return { success: false, error: 'This offer is for new clients only' };
      }
    }

    const { error } = await supabase
      .from('promotion_claims')
      .insert({
        promotion_id: promotionId,
        user_id: user.id,
        business_id: businessId,
        status: 'claimed',
      });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'You have already claimed this offer' };
      }
      return { success: false, error: 'Failed to claim offer. Please try again.' };
    }

    // Update local state
    setClaimedIds(prev => new Set([...prev, promotionId]));
    
    toast({
      title: '🎉 Offer Claimed!',
      description: promo.code
        ? `Use code: ${promo.code} when booking`
        : 'Show this to the business when you arrive',
    });

    return { success: true, promotion: promo };
  };

  return {
    promotions,
    claimedIds,
    loading,
    claimPromotion,
    refetch: fetchPromotions,
  };
}
