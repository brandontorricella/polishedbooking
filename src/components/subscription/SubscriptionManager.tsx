import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Crown, Sparkles, Star, Check, AlertTriangle, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSuperwall';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    icon: Sparkles,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: ['Business profile', 'Up to 10 services', 'Basic analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    icon: Star,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: ['Unlimited services', 'Priority placement', 'Promotions & deals'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['Featured placement', 'Advanced analytics', 'Premium support'],
  },
];

export const SubscriptionManager = () => {
  const { 
    subscription, 
    isSubscribed, 
    isTrialing, 
    daysRemaining,
    startCheckout,
    manageSubscription,
    refreshSubscription,
    isLoading 
  } = useSubscription();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = subscription?.tier || 'basic';
  const currentTierInfo = tiers.find(t => t.id === currentTier) || tiers[0];
  const TierIcon = currentTierInfo.icon;

  const handleSelectTier = async (tierId: 'basic' | 'pro' | 'elite') => {
    if (isSubscribed && tierId === currentTier) {
      await manageSubscription();
      return;
    }

    if (isSubscribed) {
      // Already subscribed - go to customer portal to change plan
      await manageSubscription();
      return;
    }

    // New subscription - go to checkout
    setIsProcessing(true);
    await startCheckout(tierId);
    setIsProcessing(false);
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    await manageSubscription();
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={cn(
        "border-2",
        isSubscribed ? "border-primary/30" : "border-destructive/30"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", currentTierInfo.bgColor)}>
              <TierIcon className={cn("w-5 h-5", currentTierInfo.color)} />
            </div>
            <div>
              <span className="font-display">{currentTierInfo.name} Plan</span>
              {isTrialing && (
                <Badge className="ml-2 bg-primary/10 text-primary text-xs">Trial</Badge>
              )}
              {!isSubscribed && !isTrialing && (
                <Badge className="ml-2 bg-destructive/10 text-destructive text-xs">Inactive</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">${currentTierInfo.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          {isTrialing && daysRemaining !== null && (
            <p className="text-sm text-muted-foreground">
              {daysRemaining} days remaining in your trial
            </p>
          )}

          {subscription?.subscriptionEndDate && isSubscribed && !isTrialing && (
            <p className="text-sm text-muted-foreground">
              Renews on {new Date(subscription.subscriptionEndDate).toLocaleDateString()}
            </p>
          )}

          {!isSubscribed && !isTrialing && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">
                Your subscription is inactive. Your business is hidden from clients.
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {currentTierInfo.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className={cn("w-4 h-4", currentTierInfo.color)} />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Change Plan Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {isSubscribed ? 'Change Plan' : 'Choose a Plan'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrent = tier.id === currentTier && isSubscribed;
              
              return (
                <motion.button
                  key={tier.id}
                  whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                  whileTap={{ scale: isCurrent ? 1 : 0.98 }}
                  onClick={() => handleSelectTier(tier.id as 'basic' | 'pro' | 'elite')}
                  disabled={isProcessing}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isCurrent
                      ? "border-primary bg-primary/5 cursor-default"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tier.bgColor)}>
                      <Icon className={cn("w-4 h-4", tier.color)} />
                    </div>
                    <span className="font-medium">{tier.name}</span>
                    {isCurrent && (
                      <Badge variant="outline" className="ml-auto text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold">${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      {isSubscribed && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Subscription Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleManageSubscription}
              disabled={isProcessing}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manage Subscription & Billing
            </Button>
            <p className="text-xs text-muted-foreground">
              Change plans, update payment method, or cancel your subscription through our secure billing portal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
