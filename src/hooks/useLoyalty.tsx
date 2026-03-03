import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface LoyaltyProgram {
  id: string;
  business_id: string;
  points_per_dollar: number;
  redemption_rate: number;
  min_redemption_points: number;
  is_active: boolean;
}

export interface UserLoyaltyPoints {
  id: string;
  user_id: string;
  business_id: string;
  points_balance: number;
  lifetime_points: number;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  business_id: string;
  booking_id: string | null;
  transaction_type: string;
  points: number;
  description: string | null;
  created_at: string;
}

export interface LoyaltyData {
  program: LoyaltyProgram | null;
  points: UserLoyaltyPoints | null;
  transactions: PointsTransaction[];
  redeemableValue: number;
  canRedeem: boolean;
  isLoading: boolean;
}

export const useLoyalty = (businessId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [points, setPoints] = useState<UserLoyaltyPoints | null>(null);
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLoyaltyData = useCallback(async () => {
    if (!businessId) { setIsLoading(false); return; }

    setIsLoading(true);
    try {
      // Fetch program (public)
      const { data: programData } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .maybeSingle();

      setProgram(programData as LoyaltyProgram | null);

      if (!programData || !user) {
        setIsLoading(false);
        return;
      }

      // Fetch user points and transactions in parallel
      const [pointsRes, txRes] = await Promise.all([
        supabase
          .from('user_loyalty_points')
          .select('*')
          .eq('user_id', user.id)
          .eq('business_id', businessId)
          .maybeSingle(),
        supabase
          .from('points_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setPoints(pointsRes.data as UserLoyaltyPoints | null);
      setTransactions((txRes.data || []) as PointsTransaction[]);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId, user]);

  useEffect(() => {
    fetchLoyaltyData();
  }, [fetchLoyaltyData]);

  const balance = points?.points_balance ?? 0;
  const redeemableValue = program ? balance * program.redemption_rate : 0;
  const canRedeem = program ? balance >= program.min_redemption_points : false;

  const earnPoints = async (bookingId: string, amount: number): Promise<number> => {
    if (!user || !program || !businessId) return 0;

    const pointsEarned = Math.floor(amount * program.points_per_dollar);
    if (pointsEarned <= 0) return 0;

    try {
      // Upsert points balance
      const existing = points;
      if (existing) {
        await supabase
          .from('user_loyalty_points')
          .update({
            points_balance: existing.points_balance + pointsEarned,
            lifetime_points: existing.lifetime_points + pointsEarned,
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_loyalty_points')
          .insert({
            user_id: user.id,
            business_id: businessId,
            points_balance: pointsEarned,
            lifetime_points: pointsEarned,
          });
      }

      // Log transaction
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        business_id: businessId,
        booking_id: bookingId,
        transaction_type: 'earned',
        points: pointsEarned,
        description: `Earned from booking`,
      });

      await fetchLoyaltyData();
      return pointsEarned;
    } catch (err) {
      console.error('Error earning points:', err);
      return 0;
    }
  };

  const redeemPoints = async (pointsToRedeem: number): Promise<{ discountValue: number } | null> => {
    if (!user || !program || !businessId || !points) return null;

    if (pointsToRedeem < program.min_redemption_points) {
      toast({ title: 'Not enough points', description: `Minimum ${program.min_redemption_points} points required.`, variant: 'destructive' });
      return null;
    }

    if (pointsToRedeem > points.points_balance) {
      toast({ title: 'Insufficient points', variant: 'destructive' });
      return null;
    }

    const discountValue = pointsToRedeem * program.redemption_rate;

    try {
      await supabase
        .from('user_loyalty_points')
        .update({ points_balance: points.points_balance - pointsToRedeem })
        .eq('id', points.id);

      await supabase.from('points_transactions').insert({
        user_id: user.id,
        business_id: businessId,
        transaction_type: 'redeemed',
        points: -pointsToRedeem,
        description: `Redeemed for $${discountValue.toFixed(2)} discount`,
      });

      toast({ title: 'Points redeemed!', description: `You saved $${discountValue.toFixed(2)}` });
      await fetchLoyaltyData();
      return { discountValue };
    } catch (err) {
      console.error('Error redeeming points:', err);
      toast({ title: 'Redemption failed', variant: 'destructive' });
      return null;
    }
  };

  return {
    program,
    points,
    transactions,
    balance,
    redeemableValue,
    canRedeem,
    isLoading,
    earnPoints,
    redeemPoints,
    refetch: fetchLoyaltyData,
  };
};
