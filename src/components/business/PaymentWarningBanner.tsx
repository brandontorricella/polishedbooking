import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, CreditCard, Ban, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';

const reasonConfig: Record<string, { title: string; desc: string; action: string; icon: typeof AlertTriangle; variant: 'destructive' | 'warning' | 'muted' }> = {
  payment_failed: {
    title: '⚠️ Payment Failed — Your listing is paused',
    desc: 'We were unable to process your payment. Update your payment method to restore your listing.',
    action: 'Update Payment Method',
    icon: CreditCard,
    variant: 'destructive',
  },
  past_due: {
    title: '⚠️ Payment Past Due — Your listing is paused',
    desc: 'Your subscription payment is overdue. Your profile is hidden from customers until payment is resolved.',
    action: 'Pay Now',
    icon: AlertTriangle,
    variant: 'warning',
  },
  canceled: {
    title: '📋 Subscription Ended — Your listing is paused',
    desc: 'Your subscription has been canceled. Resubscribe to make your listing visible again.',
    action: 'Resubscribe',
    icon: Clock,
    variant: 'muted',
  },
  trial_expired: {
    title: '⏰ Trial Ended — Your listing is paused',
    desc: 'Your free trial has expired. Subscribe to a plan to restore your listing.',
    action: 'Choose a Plan',
    icon: Clock,
    variant: 'warning',
  },
  suspended: {
    title: '🚫 Account Suspended',
    desc: 'Your account has been suspended by an administrator. Contact support for assistance.',
    action: 'Contact Support',
    icon: Ban,
    variant: 'destructive',
  },
};

export function PaymentWarningBanner() {
  const { session } = useAuth();
  const { businessId } = useAccountType();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('businesses')
      .select('is_publicly_visible, unlisted_reason, unlisted_at')
      .eq('id', businessId)
      .single()
      .then(({ data }) => setBusiness(data));
  }, [businessId]);

  if (!business || business.is_publicly_visible !== false) return null;

  const config = reasonConfig[business.unlisted_reason] || reasonConfig.past_due;

  const handleAction = async () => {
    if (business.unlisted_reason === 'suspended') {
      window.location.href = 'mailto:support@polished.app';
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border-2 p-5 mb-6 ${
        config.variant === 'destructive' 
          ? 'bg-destructive/10 border-destructive/30' 
          : config.variant === 'warning'
          ? 'bg-orange-500/10 border-orange-500/30'
          : 'bg-muted border-border'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground mb-1">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.desc}</p>
          {business.unlisted_at && (
            <p className="text-xs text-muted-foreground/60 mt-2">
              Unlisted since {new Date(business.unlisted_at).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
            </p>
          )}
        </div>
        <Button
          onClick={handleAction}
          disabled={loading}
          className="bg-gradient-primary hover:opacity-90 shrink-0"
        >
          {loading ? 'Loading...' : config.action}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
}
