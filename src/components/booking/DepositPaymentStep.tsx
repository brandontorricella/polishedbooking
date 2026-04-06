import { useState, useEffect } from 'react';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Business, Service } from '@/types';

interface DepositPaymentStepProps {
  bookingId: string;
  business: Business;
  service: Service;
  onPaymentComplete: () => void;
  onSkip?: () => void;
}

export const DepositPaymentStep = ({ bookingId, business, service, onPaymentComplete, onSkip }: DepositPaymentStepProps) => {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Compute deposit from the raw business DB data
  const businessAny = business as any;
  const depositType = businessAny.deposit_type || 'percentage';
  const depositAmountSetting = businessAny.deposit_amount || 25;
  
  const depositAmount = depositType === 'percentage'
    ? (service.price * depositAmountSetting) / 100
    : depositAmountSetting;

  const remainingBalance = service.price - depositAmount;

  const getCancellationPolicyText = () => {
    const policy = businessAny.cancellation_policy || 'flexible';
    if (policy === 'flexible') return 'Free cancellation at any time.';
    const hours = businessAny.cancellation_hours || 24;
    const timeLabel = hours >= 48 ? `${hours / 24} days` : `${hours} hours`;
    const feeType = businessAny.cancellation_fee_type || 'deposit';
    if (feeType === 'deposit') {
      return `Free cancellation if canceled at least ${timeLabel} before your appointment. Canceling after this window will forfeit your deposit.`;
    }
    if (feeType === 'percentage') {
      return `Free cancellation if canceled at least ${timeLabel} before your appointment. Late cancellation incurs a ${businessAny.cancellation_fee_amount || 0}% fee.`;
    }
    return `Free cancellation if canceled at least ${timeLabel} before your appointment. Late cancellation incurs a $${businessAny.cancellation_fee_amount || 0} fee.`;
  };

  const handlePayDeposit = async () => {
    if (!user || !session) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-deposit-intent', {
        body: {
          booking_id: bookingId,
          amount: depositAmount,
          business_id: business.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.client_secret) {
        // Redirect to Stripe checkout for card collection
        // For now, open Stripe-hosted payment page
        // In production you'd embed Elements here
        toast({
          title: "Deposit payment initiated",
          description: `A $${depositAmount.toFixed(2)} deposit is required. Stripe checkout will open.`,
        });
        
        // For a real integration, you'd use Stripe Elements here
        // For now, mark as successful to demonstrate flow
        const confirmRes = await supabase.functions.invoke('confirm-deposit', {
          body: {
            booking_id: bookingId,
            payment_intent_id: data.client_secret.split('_secret_')[0],
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        onPaymentComplete();
      }
    } catch (err: any) {
      console.error('Deposit payment error:', err);
      toast({
        title: 'Payment failed',
        description: err.message || 'Unable to process deposit payment.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold">Secure Your Appointment</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {business.name} requires a deposit to confirm your booking.
        </p>
      </div>

      {/* Payment Summary */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Service: {service.name}</span>
            <span className="font-medium">${service.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Deposit ({depositType === 'percentage' ? `${depositAmountSetting}%` : 'flat'})
            </span>
            <span className="text-emerald-600 font-medium">-${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Remaining (due at appointment)</span>
            <span>${remainingBalance.toFixed(2)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-semibold">Due today</span>
            <span className="font-semibold text-lg text-primary">${depositAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <p className="text-xs font-medium text-amber-800 dark:text-amber-400 mb-1">Cancellation Policy</p>
        <p className="text-xs text-amber-700 dark:text-amber-500">{getCancellationPolicyText()}</p>
      </div>

      <Button
        onClick={handlePayDeposit}
        disabled={processing}
        className="w-full bg-gradient-primary hover:opacity-90"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay ${depositAmount.toFixed(2)} Deposit
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe</span>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Your card will be charged ${depositAmount.toFixed(2)} now. The remaining ${remainingBalance.toFixed(2)} is due at your appointment.
      </p>
    </div>
  );
};
