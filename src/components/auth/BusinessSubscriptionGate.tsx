import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSuperwall } from '@/hooks/useSuperwall';
import { useToast } from '@/hooks/use-toast';

interface BusinessSubscriptionGateProps {
  children: ReactNode;
  requireActive?: boolean;
  fallbackPath?: string;
}

/**
 * Gated component that requires an active subscription or trial for business features.
 * 
 * This gate enforces the following rules:
 * - Only business accounts can access
 * - Must have an active subscription OR active trial
 * - If subscription is expired/canceled, business profile is hidden
 */
export const BusinessSubscriptionGate = ({ 
  children, 
  requireActive = true,
  fallbackPath = '/business/pricing'
}: BusinessSubscriptionGateProps) => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, isSubscribed, showPaywall } = useSuperwall();
  const { toast } = useToast();

  const isLoading = authLoading || subLoading;
  const isBusinessUser = profile?.role === 'business';
  const hasActiveSubscription = isSubscribed;

  useEffect(() => {
    if (isLoading) return;

    // Not logged in
    if (!user) {
      navigate('/auth?mode=login&role=business');
      return;
    }

    // Not a business account
    if (!isBusinessUser) {
      toast({
        title: 'Business Account Required',
        description: 'This feature is only available for business accounts.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    // Subscription required but not active
    if (requireActive && !hasActiveSubscription) {
      toast({
        title: 'Subscription Required',
        description: 'An active subscription is required to access this feature.',
        variant: 'destructive',
      });
      
      // Show paywall automatically
      showPaywall(subscription?.tier || 'basic');
    }
  }, [isLoading, user, isBusinessUser, hasActiveSubscription, requireActive, navigate, toast, showPaywall, subscription?.tier]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
    );
  }

  // Not authorized
  if (!user || !isBusinessUser) {
    return null;
  }

  // Subscription required but not active - still render but may show upgrade prompt
  if (requireActive && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h2 className="font-display text-2xl font-bold mb-2">Subscription Required</h2>
          <p className="text-muted-foreground mb-6">
            Your subscription has expired or is not active. Reactivate to continue using business features.
          </p>
          <button 
            onClick={() => showPaywall(subscription?.tier || 'basic')}
            className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Reactivate Subscription
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Higher-order component to wrap pages with subscription gating
 */
export const withSubscriptionGate = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  gateProps?: Omit<BusinessSubscriptionGateProps, 'children'>
) => {
  return function WithSubscriptionGate(props: P) {
    return (
      <BusinessSubscriptionGate {...gateProps}>
        <WrappedComponent {...props} />
      </BusinessSubscriptionGate>
    );
  };
};
