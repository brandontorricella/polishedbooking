import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type SubscriptionState = 'none' | 'trialing' | 'active' | 'expired' | 'canceled';

export interface StripeSubscription {
  state: SubscriptionState;
  tier: 'basic' | 'pro' | 'elite';
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
}

interface SubscriptionContextValue {
  subscription: StripeSubscription | null;
  isLoading: boolean;
  error: string | null;
  startCheckout: (tier: 'basic' | 'pro' | 'elite', billing?: 'monthly' | 'annual') => Promise<void>;
  manageSubscription: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  isTrialing: boolean;
  isSubscribed: boolean;
  daysRemaining: number | null;
  // Legacy compatibility aliases
  showPaywall: (tier: 'basic' | 'pro' | 'elite') => Promise<boolean>;
  changeTier: (newTier: 'basic' | 'pro' | 'elite') => Promise<boolean>;
  cancelSubscription: () => Promise<boolean>;
  restorePurchases: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<StripeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    if (profile?.role !== 'business') {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('check-subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) {
        console.error('[Subscription] Check error:', fnError);
        // Fall back to database state
        await loadFromDatabase();
        return;
      }

      if (data?.subscribed) {
        setSubscription({
          state: data.is_trialing ? 'trialing' : 'active',
          tier: data.tier || 'basic',
          trialEndDate: data.trial_end,
          subscriptionEndDate: data.subscription_end,
          isActive: true,
        });
      } else {
        // Check database for existing state
        await loadFromDatabase();
      }
    } catch (err) {
      console.error('[Subscription] Error:', err);
      await loadFromDatabase();
    } finally {
      setIsLoading(false);
    }
  }, [user, profile]);

  const loadFromDatabase = async () => {
    if (!user) return;
    
    try {
      const { data: biz } = await supabase
        .from('businesses')
        .select('subscription_status, subscription_tier, subscription_ends_at, trial_ends_at')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (biz) {
        const isActive = biz.subscription_status === 'active' || biz.subscription_status === 'trialing';
        setSubscription({
          state: (biz.subscription_status as SubscriptionState) || 'none',
          tier: (biz.subscription_tier as 'basic' | 'pro' | 'elite') || 'basic',
          trialEndDate: biz.trial_ends_at,
          subscriptionEndDate: biz.subscription_ends_at,
          isActive,
        });
      } else {
        setSubscription({ state: 'none', tier: 'basic', trialEndDate: null, subscriptionEndDate: null, isActive: false });
      }
    } catch {
      setSubscription({ state: 'none', tier: 'basic', trialEndDate: null, subscriptionEndDate: null, isActive: false });
    }
  };

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!user || profile?.role !== 'business') return;
    const interval = setInterval(refreshSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, profile, refreshSubscription]);

  const startCheckout = useCallback(async (tier: 'basic' | 'pro' | 'elite', billing?: 'monthly' | 'annual') => {
    if (!user) {
      setError('User must be logged in');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { tier, billing: billing || 'monthly' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('[Subscription] Checkout error:', err);
      setError(err.message || 'Failed to start checkout');
    }
  }, [user]);

  const manageSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error: fnError } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data?.error || 'Failed to open customer portal');
      }
    } catch (err: any) {
      console.error('[Subscription] Portal error:', err);
      setError(err.message || 'Failed to open subscription management');
    }
  }, [user]);

  // Legacy compatibility
  const showPaywall = useCallback(async (tier: 'basic' | 'pro' | 'elite'): Promise<boolean> => {
    await startCheckout(tier);
    return false; // Redirects, so this won't actually return true
  }, [startCheckout]);

  const changeTier = useCallback(async (newTier: 'basic' | 'pro' | 'elite'): Promise<boolean> => {
    await manageSubscription();
    return false;
  }, [manageSubscription]);

  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    await manageSubscription();
    return false;
  }, [manageSubscription]);

  const restorePurchases = useCallback(async () => {
    await refreshSubscription();
  }, [refreshSubscription]);

  const isTrialing = subscription?.state === 'trialing';
  const isSubscribed = subscription?.isActive ?? false;

  const daysRemaining = (() => {
    if (!subscription?.trialEndDate && !subscription?.subscriptionEndDate) return null;
    const endDate = subscription.trialEndDate || subscription.subscriptionEndDate;
    if (!endDate) return null;
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  })();

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        startCheckout,
        manageSubscription,
        refreshSubscription,
        isTrialing,
        isSubscribed,
        daysRemaining,
        showPaywall,
        changeTier,
        cancelSubscription,
        restorePurchases,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

// Primary hook
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Legacy alias for backward compatibility
export const useSuperwall = useSubscription;

// Legacy types for backward compatibility
export type SuperwallSubscription = StripeSubscription;
export const SuperwallProvider = SubscriptionProvider;
