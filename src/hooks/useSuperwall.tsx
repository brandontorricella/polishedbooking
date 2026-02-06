import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Superwall subscription states
export type SubscriptionState = 'none' | 'trialing' | 'active' | 'expired' | 'canceled';

export interface SuperwallSubscription {
  state: SubscriptionState;
  tier: 'basic' | 'pro' | 'elite';
  trialEndDate: string | null;
  subscriptionEndDate: string | null;
  isActive: boolean;
}

interface SuperwallContextValue {
  subscription: SuperwallSubscription | null;
  isLoading: boolean;
  error: string | null;
  showPaywall: (tier: 'basic' | 'pro' | 'elite') => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  isTrialing: boolean;
  isSubscribed: boolean;
  daysRemaining: number | null;
}

const SuperwallContext = createContext<SuperwallContextValue | null>(null);

// Native bridge interface for Superwall SDK
// This will be replaced with actual Capacitor plugin calls
interface SuperwallBridge {
  initialize: (apiKey: string) => Promise<void>;
  identify: (userId: string) => Promise<void>;
  presentPaywall: (placement: string, params?: Record<string, any>) => Promise<{ purchased: boolean }>;
  getSubscriptionStatus: () => Promise<{
    isActive: boolean;
    productId: string | null;
    expiresAt: string | null;
    trialEndAt: string | null;
    status: string;
  }>;
  restorePurchases: () => Promise<void>;
}

// Mock bridge for development - will be replaced with actual native implementation
const mockSuperwallBridge: SuperwallBridge = {
  initialize: async () => {
    console.log('[Superwall] Initialize called - SDK not configured');
  },
  identify: async (userId) => {
    console.log('[Superwall] Identify user:', userId);
  },
  presentPaywall: async (placement) => {
    console.log('[Superwall] Present paywall:', placement);
    // In development, simulate successful purchase after confirmation
    const confirmed = window.confirm(
      `[Development Mode]\n\nSuperwall Paywall: ${placement}\n\nSimulate successful subscription?`
    );
    return { purchased: confirmed };
  },
  getSubscriptionStatus: async () => {
    // Check local storage for development mock state
    const mockState = localStorage.getItem('superwall_mock_subscription');
    if (mockState) {
      return JSON.parse(mockState);
    }
    return {
      isActive: false,
      productId: null,
      expiresAt: null,
      trialEndAt: null,
      status: 'none',
    };
  },
  restorePurchases: async () => {
    console.log('[Superwall] Restore purchases called');
  },
};

// Get the native bridge (Capacitor plugin) or fall back to mock
const getSuperwallBridge = (): SuperwallBridge => {
  // Check if we're in a native environment with the Superwall plugin
  if (typeof window !== 'undefined' && (window as any).Capacitor?.Plugins?.Superwall) {
    return (window as any).Capacitor.Plugins.Superwall as SuperwallBridge;
  }
  return mockSuperwallBridge;
};

export const SuperwallProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [subscription, setSubscription] = useState<SuperwallSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map Superwall status to our subscription state
  const mapStatusToState = (status: string): SubscriptionState => {
    switch (status) {
      case 'active':
        return 'active';
      case 'trialing':
        return 'trialing';
      case 'expired':
      case 'past_due':
        return 'expired';
      case 'canceled':
        return 'canceled';
      default:
        return 'none';
    }
  };

  // Sync subscription state to backend
  const syncToBackend = useCallback(async (sub: SuperwallSubscription) => {
    if (!user || !profile || profile.role !== 'business') return;

    try {
      // Update the business record with subscription state
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          subscription_status: sub.state === 'active' || sub.state === 'trialing' ? sub.state : 'canceled',
          subscription_tier: sub.tier,
          subscription_ends_at: sub.subscriptionEndDate,
          trial_ends_at: sub.trialEndDate,
          is_published: sub.isActive,
        })
        .eq('owner_id', user.id);

      if (updateError) {
        console.error('[Superwall] Failed to sync subscription to backend:', updateError);
      }
    } catch (err) {
      console.error('[Superwall] Error syncing to backend:', err);
    }
  }, [user, profile]);

  // Refresh subscription status
  const refreshSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bridge = getSuperwallBridge();
      const status = await bridge.getSubscriptionStatus();

      const tierFromProduct = (productId: string | null): 'basic' | 'pro' | 'elite' => {
        if (!productId) return 'basic';
        if (productId.includes('elite')) return 'elite';
        if (productId.includes('pro')) return 'pro';
        return 'basic';
      };

      const newSubscription: SuperwallSubscription = {
        state: mapStatusToState(status.status),
        tier: tierFromProduct(status.productId),
        trialEndDate: status.trialEndAt,
        subscriptionEndDate: status.expiresAt,
        isActive: status.isActive,
      };

      setSubscription(newSubscription);

      // Sync to backend
      await syncToBackend(newSubscription);
    } catch (err) {
      console.error('[Superwall] Error refreshing subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
    } finally {
      setIsLoading(false);
    }
  }, [user, syncToBackend]);

  // Initialize Superwall when user changes
  useEffect(() => {
    const initialize = async () => {
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      try {
        const bridge = getSuperwallBridge();
        
        // Initialize with API key (to be configured)
        // API key should be stored securely and injected during build
        const apiKey = import.meta.env.VITE_SUPERWALL_API_KEY || '';
        if (apiKey) {
          await bridge.initialize(apiKey);
        }

        // Identify the user
        await bridge.identify(user.id);

        // Refresh subscription status
        await refreshSubscription();
      } catch (err) {
        console.error('[Superwall] Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize');
        setIsLoading(false);
      }
    };

    initialize();
  }, [user, refreshSubscription]);

  // Show paywall for a specific tier
  const showPaywall = useCallback(async (tier: 'basic' | 'pro' | 'elite'): Promise<boolean> => {
    if (!user) {
      setError('User must be logged in');
      return false;
    }

    // Only business accounts should see paywalls
    if (profile?.role !== 'business') {
      console.log('[Superwall] Paywall not shown - user is not a business account');
      return false;
    }

    try {
      const bridge = getSuperwallBridge();
      const placement = `${tier}_subscription`;
      
      const result = await bridge.presentPaywall(placement, {
        tier,
        userId: user.id,
        email: profile?.email,
      });

      if (result.purchased) {
        // Refresh subscription after purchase
        await refreshSubscription();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[Superwall] Paywall error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      return false;
    }
  }, [user, profile, refreshSubscription]);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    try {
      const bridge = getSuperwallBridge();
      await bridge.restorePurchases();
      await refreshSubscription();
    } catch (err) {
      console.error('[Superwall] Restore error:', err);
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
    }
  }, [refreshSubscription]);

  // Computed values
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
    <SuperwallContext.Provider
      value={{
        subscription,
        isLoading,
        error,
        showPaywall,
        restorePurchases,
        refreshSubscription,
        isTrialing,
        isSubscribed,
        daysRemaining,
      }}
    >
      {children}
    </SuperwallContext.Provider>
  );
};

export const useSuperwall = () => {
  const context = useContext(SuperwallContext);
  if (!context) {
    throw new Error('useSuperwall must be used within a SuperwallProvider');
  }
  return context;
};

// Re-export for backward compatibility during migration
export const useSubscription = useSuperwall;
