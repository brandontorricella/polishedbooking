import { AlertTriangle, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

export const SubscriptionBanner = () => {
  const { subscription, isTrialing, daysRemaining, openCustomerPortal, isLoading } = useSubscription();

  if (isLoading || !subscription) return null;

  // Show trial banner if trialing
  if (isTrialing && daysRemaining !== null) {
    const isUrgent = daysRemaining <= 3;

    return (
      <div className={cn(
        "px-4 py-3 flex items-center justify-between gap-4",
        isUrgent 
          ? "bg-destructive/10 border-b border-destructive/20" 
          : "bg-primary/10 border-b border-primary/20"
      )}>
        <div className="flex items-center gap-3">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 text-destructive" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary" />
          )}
          <div>
            <p className={cn(
              "text-sm font-medium",
              isUrgent ? "text-destructive" : "text-primary"
            )}>
              {daysRemaining === 0 
                ? "Your trial ends today!" 
                : daysRemaining === 1 
                  ? "1 day left in your trial" 
                  : `${daysRemaining} days left in your trial`
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Add a payment method to continue using {subscription.tier} features
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={openCustomerPortal}
          className={cn(
            isUrgent 
              ? "bg-destructive hover:bg-destructive/90" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
      </div>
    );
  }

  // Show past_due warning
  if (subscription.status === 'past_due') {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Payment failed - please update your payment method
            </p>
            <p className="text-xs text-muted-foreground">
              Your subscription will be canceled if payment is not received
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={openCustomerPortal}
        >
          Update Payment
        </Button>
      </div>
    );
  }

  return null;
};
