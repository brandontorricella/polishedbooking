import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Crown, Sparkles, Star, Check, AlertTriangle, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSuperwall';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ConfirmPlanChangeModal } from './ConfirmPlanChangeModal';

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
    features: ['Everything in Basic', 'Unlimited services', 'Priority placement', 'Promotions & deals', 'Analytics dashboard'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    icon: Crown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['Everything in Pro', 'Featured placement', 'Advanced analytics', 'Premium support', 'Verified badge'],
  },
];

const tierOrder: Record<string, number> = { basic: 1, pro: 2, elite: 3 };

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
  const [changingTo, setChangingTo] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Check URL params for success/cancel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const plan = params.get('plan');
      toast({
        title: 'Plan Updated!',
        description: plan ? `Successfully switched to ${plan} plan.` : 'Subscription updated successfully.',
      });
      window.history.replaceState({}, '', window.location.pathname);
      refreshSubscription();
    }
    if (params.get('canceled') === 'true') {
      toast({ title: 'Plan change canceled', variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const currentTier = subscription?.tier || 'basic';
  const currentTierInfo = tiers.find(t => t.id === currentTier) || tiers[0];
  const TierIcon = currentTierInfo.icon;

  const handleSwitchPlan = (tierId: string) => {
    if (tierId === currentTier && isSubscribed) return;
    
    if (!isSubscribed) {
      // No subscription — go to checkout
      startCheckout(tierId as 'basic' | 'pro' | 'elite');
      return;
    }

    // Show confirmation modal
    setSelectedTier(tierId);
    setShowConfirmModal(true);
  };

  const confirmSwitchPlan = async () => {
    if (!selectedTier) return;
    setShowConfirmModal(false);
    setChangingTo(selectedTier);
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error: fnError } = await supabase.functions.invoke('change-plan', {
        body: { new_tier: selectedTier },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (fnError) throw fnError;

      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }

      if (data?.success) {
        toast({ title: 'Plan Updated!', description: data.message });
        await refreshSubscription();
      } else if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('[ChangePlan] Error:', err);
      toast({
        title: 'Failed to change plan',
        description: err.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setChangingTo(null);
      setSelectedTier(null);
    }
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

      {/* Plan Cards */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            {isSubscribed ? 'Switch Plan' : 'Choose a Plan'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier) => {
              const Icon = tier.icon;
              const isCurrent = tier.id === currentTier && isSubscribed;
              const isUpgrade = (tierOrder[tier.id] || 0) > (tierOrder[currentTier] || 0);
              const isDowngrade = (tierOrder[tier.id] || 0) < (tierOrder[currentTier] || 0);
              const isChangingThis = changingTo === tier.id;

              return (
                <motion.div
                  key={tier.id}
                  whileHover={{ scale: isCurrent ? 1 : 1.02 }}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col",
                    isCurrent
                      ? "border-primary bg-primary/5"
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
                  
                  <p className="text-xl font-bold mb-3">
                    ${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>

                  <ul className="space-y-1.5 mb-4 flex-1">
                    {tier.features.map((f) => (
                      <li key={f} className="text-xs flex items-start gap-1.5">
                        <Check className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", tier.color)} />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSwitchPlan(tier.id)}
                      disabled={isProcessing}
                      variant={isUpgrade || !isSubscribed ? "default" : "outline"}
                      className={cn(
                        "w-full",
                        (isUpgrade || !isSubscribed) && "bg-primary hover:bg-primary/90"
                      )}
                    >
                      {isChangingThis ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : !isSubscribed ? (
                        `Start with ${tier.name}`
                      ) : isUpgrade ? (
                        `Upgrade to ${tier.name}`
                      ) : (
                        `Switch to ${tier.name}`
                      )}
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Manage Billing */}
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
              Change payment method, view invoices, or cancel your subscription through our secure billing portal.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Modal */}
      {selectedTier && (
        <ConfirmPlanChangeModal
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
          currentTier={currentTier}
          newTier={selectedTier}
          plans={tiers}
          onConfirm={confirmSwitchPlan}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};
