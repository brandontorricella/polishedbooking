import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Crown, 
  Sparkles, 
  Star, 
  Check, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSuperwall } from '@/hooks/useSuperwall';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
    changeTier,
    cancelSubscription,
    restorePurchases,
    isLoading 
  } = useSuperwall();
  const { toast } = useToast();
  const [isChanging, setIsChanging] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const currentTier = subscription?.tier || 'basic';
  const currentTierInfo = tiers.find(t => t.id === currentTier) || tiers[0];
  const TierIcon = currentTierInfo.icon;

  const handleChangeTier = async (newTier: 'basic' | 'pro' | 'elite') => {
    if (newTier === currentTier) return;
    
    setIsChanging(true);
    const success = await changeTier(newTier);
    
    if (success) {
      toast({
        title: 'Plan Changed!',
        description: `You are now on the ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} plan.`,
      });
    }
    setIsChanging(false);
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    const success = await cancelSubscription();
    
    if (success) {
      toast({
        title: 'Subscription Canceled',
        description: 'Your business profile will be hidden from clients.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Cancellation Failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
    setIsCanceling(false);
  };

  const handleRestorePurchases = async () => {
    await restorePurchases();
    toast({
      title: 'Purchases Restored',
      description: 'Your subscription status has been refreshed.',
    });
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
          <CardTitle className="font-display text-lg">Change Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrent = tier.id === currentTier;
              
              return (
                <motion.button
                  key={tier.id}
                  whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                  whileTap={{ scale: isCurrent ? 1 : 0.98 }}
                  onClick={() => handleChangeTier(tier.id as 'basic' | 'pro' | 'elite')}
                  disabled={isCurrent || isChanging || !isSubscribed}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isCurrent
                      ? "border-primary bg-primary/5 cursor-default"
                      : isSubscribed
                        ? "border-border hover:border-primary/50"
                        : "border-border opacity-50 cursor-not-allowed"
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
          
          {!isSubscribed && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Reactivate your subscription to change plans
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">Subscription Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleRestorePurchases}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Restore Purchases
          </Button>

          {isSubscribed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  disabled={isCanceling}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isCanceling ? 'Canceling...' : 'Cancel Subscription'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your business profile will be hidden from clients immediately. 
                    You can resubscribe at any time to restore visibility.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancelSubscription}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
