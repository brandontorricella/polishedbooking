import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionInfo {
  subscribed: boolean;
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  tier: 'basic' | 'pro' | 'elite';
  subscription_end: string | null;
  trial_end: string | null;
  subscription_id: string | null;
}

export const useSubscription = () => {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        setError(data.error);
        setSubscription(null);
      } else {
        setSubscription({
          subscribed: data.subscribed || false,
          status: data.status || 'none',
          tier: data.tier || 'basic',
          subscription_end: data.subscription_end || null,
          trial_end: data.trial_end || null,
          subscription_id: data.subscription_id || null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  const createCheckout = async (tier: 'basic' | 'pro' | 'elite', businessId?: string) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
      body: { tier, businessId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (fnError) throw fnError;
    if (data.error) throw new Error(data.error);

    // Open checkout in new tab
    if (data.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error: fnError } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (fnError) throw fnError;
    if (data.error) throw new Error(data.error);

    // Open portal in new tab
    if (data.url) {
      window.open(data.url, '_blank');
    }

    return data;
  };

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh subscription status periodically
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    isTrialing: subscription?.status === 'trialing',
    isActive: subscription?.subscribed || false,
    daysRemaining: subscription?.trial_end 
      ? Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
};
