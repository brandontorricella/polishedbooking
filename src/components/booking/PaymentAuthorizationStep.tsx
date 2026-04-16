import { useEffect, useMemo, useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Loader2, Lock, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getStripe } from '@/lib/stripe';
import { cn } from '@/lib/utils';
import type { Business, Service } from '@/types';

interface Props {
  bookingId: string;
  business: Business;
  service: Service;
  onAuthorized: (data: { paymentMethodId: string; customerId: string }) => void;
  onBnplSelected: (provider: 'afterpay_clearpay' | 'klarna' | 'affirm') => Promise<void>;
}

const BNPL_OPTIONS = [
  { id: 'afterpay_clearpay' as const, label: 'Afterpay', emoji: '🅰️', desc: '4 interest-free payments' },
  { id: 'klarna' as const, label: 'Klarna', emoji: '🅺', desc: 'Pay in 4 or over time' },
  { id: 'affirm' as const, label: 'Affirm', emoji: '🅰', desc: 'Monthly payment plans' },
];

const InnerCardForm = ({
  onAuthorized,
  customerId,
}: {
  onAuthorized: Props['onAuthorized'];
  customerId: string;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });
    if (error) {
      toast({ title: 'Could not save card', description: error.message || 'Please try again.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    const pmId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id;
    if (!pmId) {
      toast({ title: 'Card not saved', description: 'Please try a different card.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }
    onAuthorized({ paymentMethodId: pmId, customerId });
  };

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button
        onClick={handleSubmit}
        disabled={submitting || !stripe}
        className="w-full bg-gradient-primary"
        size="lg"
      >
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Authorizing…</> : <><Lock className="w-4 h-4 mr-2" /> Save card & confirm booking</>}
      </Button>
    </div>
  );
};

export const PaymentAuthorizationStep = ({ bookingId, business, service, onAuthorized, onBnplSelected }: Props) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'card' | 'bnpl'>('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(true);
  const [bnplLoading, setBnplLoading] = useState<string | null>(null);

  const stripePromise = useMemo(() => getStripe(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!session) return;
      setLoadingSecret(true);
      try {
        const { data, error } = await supabase.functions.invoke('create-setup-intent', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: {},
        });
        if (error) throw error;
        if (!cancelled) {
          setClientSecret(data.client_secret);
          setCustomerId(data.customer_id);
        }
      } catch (e: any) {
        toast({ title: 'Could not initialize payment', description: e.message, variant: 'destructive' });
      } finally {
        if (!cancelled) setLoadingSecret(false);
      }
    })();
    return () => { cancelled = true; };
  }, [session]);

  const handleBnpl = async (provider: 'afterpay_clearpay' | 'klarna' | 'affirm') => {
    setBnplLoading(provider);
    try {
      await onBnplSelected(provider);
    } finally {
      setBnplLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold">Add payment method</h3>
        <p className="text-sm text-muted-foreground mt-1">
          You won't be charged until after your appointment.
        </p>
      </div>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          Your card will not be charged until after your appointment is complete. {business.name} will confirm the final amount and send you a tip request.
        </p>
      </div>

      <div className="flex gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setTab('card')}
          className={cn(
            'flex-1 px-3 py-2 rounded-md text-sm font-medium transition',
            tab === 'card' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          )}
        >
          <CreditCard className="w-4 h-4 inline mr-1" /> Card
        </button>
        <button
          onClick={() => setTab('bnpl')}
          className={cn(
            'flex-1 px-3 py-2 rounded-md text-sm font-medium transition',
            tab === 'bnpl' ? 'bg-background shadow-sm' : 'text-muted-foreground'
          )}
        >
          Pay over time
        </button>
      </div>

      {tab === 'card' && (
        <div>
          {loadingSecret ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : clientSecret && customerId ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <InnerCardForm onAuthorized={onAuthorized} customerId={customerId} />
            </Elements>
          ) : (
            <p className="text-sm text-destructive text-center py-4">Could not load card form. Please try again.</p>
          )}
        </div>
      )}

      {tab === 'bnpl' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center mb-2">
            Note: BNPL providers charge at booking. Your service is fully paid; tips are charged separately if added after your appointment.
          </p>
          {BNPL_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleBnpl(opt.id)}
              disabled={bnplLoading !== null}
              className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-border hover:border-primary/50 transition text-left disabled:opacity-50"
            >
              <span className="text-2xl">{opt.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete your {opt.label} application — booking confirms after approval.
                </p>
              </div>
              {bnplLoading === opt.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-muted-foreground">→</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-2">
        <Lock className="w-3 h-3" /> Secured by Stripe
      </div>
    </div>
  );
};
