import { AlertTriangle, Sparkles, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSuperwall';
import { cn } from '@/lib/utils';

export const SubscriptionBanner = () => {
  const { subscription, isTrialing, daysRemaining, manageSubscription, isLoading } = useSubscription();

  if (isLoading || !subscription) return null;

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
              Your subscription will continue automatically after trial ends
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => manageSubscription()}
          className={cn(
            isUrgent 
              ? "bg-destructive hover:bg-destructive/90" 
              : "bg-primary hover:bg-primary/90"
          )}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Manage Subscription
        </Button>
      </div>
    );
  }

  if (subscription.state === 'expired' || subscription.state === 'canceled') {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Your subscription has {subscription.state === 'expired' ? 'expired' : 'been canceled'}
            </p>
            <p className="text-xs text-muted-foreground">
              Your business profile is no longer visible to clients
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => manageSubscription()}
        >
          Reactivate
        </Button>
      </div>
    );
  }

  return null;
};
