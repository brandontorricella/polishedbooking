import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSuperwall';
import { useToast } from '@/hooks/use-toast';

interface BusinessSubscriptionGateProps {
  children: ReactNode;
  requireActive?: boolean;
  fallbackPath?: string;
}

export const BusinessSubscriptionGate = ({ 
  children, 
  requireActive = true,
  fallbackPath = '/business/pricing'
}: BusinessSubscriptionGateProps) => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, isLoading: subLoading, isSubscribed, startCheckout } = useSubscription();
  const { toast } = useToast();

  const isLoading = authLoading || subLoading;
  const isBusinessUser = profile?.role === 'business';
  const hasActiveSubscription = isSubscribed;

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate('/auth?mode=login&role=business');
      return;
    }

    if (!isBusinessUser) {
      toast({
        title: 'Business Account Required',
        description: 'This feature is only available for business accounts.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (requireActive && !hasActiveSubscription) {
      toast({
        title: 'Subscription Required',
        description: 'An active subscription is required to access this feature.',
        variant: 'destructive',
      });
      navigate(fallbackPath);
    }
  }, [isLoading, user, isBusinessUser, hasActiveSubscription, requireActive, navigate, toast, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
      </div>
    );
  }

  if (!user || !isBusinessUser) {
    return null;
  }

  if (requireActive && !hasActiveSubscription) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h2 className="font-display text-2xl font-bold mb-2">Subscription Required</h2>
          <p className="text-muted-foreground mb-6">
            Your subscription has expired or is not active. Reactivate to continue using business features.
          </p>
          <button 
            onClick={() => navigate('/business/pricing')}
            className="px-6 py-3 bg-gradient-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            View Plans
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

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
