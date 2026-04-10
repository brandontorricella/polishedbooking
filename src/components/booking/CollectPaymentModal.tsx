import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft, CheckCircle, Smartphone, Link2, CreditCard, Banknote, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CollectPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    business_id: string;
    total_price: number;
    client?: {
      display_name: string | null;
      email: string;
      phone: string | null;
    } | null;
    service?: {
      name: string;
    } | null;
  };
  onPaymentCollected: () => void;
}

type PaymentMethod = 'tap_to_pay' | 'payment_link' | 'card_reader' | 'cash' | 'venmo' | null;

const PAYMENT_METHODS = [
  {
    id: 'tap_to_pay' as const,
    icon: Smartphone,
    label: 'Tap to Pay',
    desc: 'Client taps their phone or card on your device',
  },
  {
    id: 'payment_link' as const,
    icon: Link2,
    label: 'Send Payment Link',
    desc: 'Send a secure Stripe link via email',
  },
  {
    id: 'card_reader' as const,
    icon: CreditCard,
    label: 'Card Reader',
    desc: 'Use your Stripe Terminal reader',
  },
  {
    id: 'cash' as const,
    icon: Banknote,
    label: 'Cash',
    desc: 'Record a cash payment',
  },
  {
    id: 'venmo' as const,
    icon: Wallet,
    label: 'Venmo / Zelle / Other',
    desc: 'Record an off-platform payment',
  },
];

export const CollectPaymentModal = ({
  open,
  onOpenChange,
  booking,
  onPaymentCollected,
}: CollectPaymentModalProps) => {
  const { user } = useAuth();
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [amount, setAmount] = useState(String(booking.total_price || 0));
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState('');

  const clientName = booking.client?.display_name || 'Client';
  const serviceName = booking.service?.name || 'Service';

  const resetState = () => {
    setMethod(null);
    setNote('');
    setLinkSent(false);
    setError('');
  };

  const handleMarkAsPaid = async (paymentMethod: string) => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setProcessing(true);
    setError('');

    try {
      // Record the in-person payment
      const { error: insertError } = await supabase
        .from('inperson_payments')
        .insert({
          booking_id: booking.id,
          business_id: booking.business_id,
          amount: parsedAmount,
          payment_method: paymentMethod,
          payment_method_note: note || null,
          recorded_by: user?.id || '',
        });

      if (insertError) throw insertError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'completed' as any,
          payment_collected_inperson: true,
        })
        .eq('id', booking.id);

      if (updateError) throw updateError;

      toast.success('Payment recorded ✅');
      onPaymentCollected();
      onOpenChange(false);
      resetState();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    }
    setProcessing(false);
  };

  const handleSendPaymentLink = async () => {
    setProcessing(true);
    setError('');

    try {
      // Use edge function to create and send payment link
      const { data, error: fnError } = await supabase.functions.invoke('send-payment-link', {
        body: {
          booking_id: booking.id,
          amount: parseFloat(amount),
          client_email: booking.client?.email,
        },
      });

      if (fnError) throw fnError;

      // Update booking with link sent timestamp
      await supabase
        .from('bookings')
        .update({ payment_link_sent_at: new Date().toISOString() })
        .eq('id', booking.id);

      setLinkSent(true);
      toast.success('Payment link sent! ✅');
    } catch (err: any) {
      setError('Failed to send payment link. The feature requires additional setup.');
    }
    setProcessing(false);
  };

  const handleTapToPay = async () => {
    // Tap to Pay requires Stripe Terminal SDK on device
    // For now, show info and fall back to mark-as-paid
    setError('Tap to Pay requires the Stripe Terminal SDK. For now, use another payment method.');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState(); }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Collect Payment
          </DialogTitle>
        </DialogHeader>

        {/* Booking Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Client</span>
            <span className="font-medium">{clientName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Service</span>
            <span className="font-medium">{serviceName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0.01"
                className="h-7 w-20 text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Method Selection */}
        {!method && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">How is the client paying?</p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                    <span className="text-muted-foreground">→</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tap to Pay Flow */}
        {method === 'tap_to_pay' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMethod(null); setError(''); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center space-y-3 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Tap to Pay</h3>
              <p className="text-sm text-muted-foreground">
                Ask {clientName} to hold their phone or contactless card near your device.
              </p>
              <p className="text-2xl font-bold text-primary">${parseFloat(amount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Requires NFC. Works with Apple Pay, Google Pay, and contactless cards.
              </p>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button className="w-full" onClick={handleTapToPay} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : `Charge $${parseFloat(amount).toFixed(2)}`}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or <button className="underline" onClick={() => handleMarkAsPaid('tap_to_pay')}>record as collected</button> if already paid.
            </p>
          </div>
        )}

        {/* Payment Link Flow */}
        {method === 'payment_link' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMethod(null); setError(''); setLinkSent(false); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {!linkSent ? (
              <div className="space-y-4">
                <div className="text-center space-y-3 py-2">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Link2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Send Payment Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Send {clientName} a secure Stripe payment link via email.
                  </p>
                </div>
                {booking.client?.email && (
                  <div className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                    <span>📧</span>
                    <span className="text-muted-foreground">{booking.client.email}</span>
                  </div>
                )}
                <p className="text-center text-xl font-bold">${parseFloat(amount).toFixed(2)}</p>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button className="w-full" onClick={handleSendPaymentLink} disabled={processing}>
                  {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> : `Send $${parseFloat(amount).toFixed(2)} Link`}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="font-semibold text-lg">Payment Link Sent!</h3>
                <p className="text-sm text-muted-foreground">
                  {clientName} will receive the link shortly. Once they pay, the booking will automatically update.
                </p>
                <Button onClick={() => { onOpenChange(false); resetState(); }}>Done</Button>
              </div>
            )}
          </div>
        )}

        {/* Card Reader Flow */}
        {method === 'card_reader' && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMethod(null); setError(''); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center space-y-3 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Stripe Terminal Reader</h3>
              <p className="text-sm text-muted-foreground">
                Use your Stripe Terminal reader to collect ${parseFloat(amount).toFixed(2)}.
              </p>
              <p className="text-xs text-muted-foreground">
                Stripe Terminal integration requires additional setup. You can record the payment manually below.
              </p>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button className="w-full" onClick={() => handleMarkAsPaid('card_reader')} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording...</> : `Record $${parseFloat(amount).toFixed(2)} as Collected`}
            </Button>
          </div>
        )}

        {/* Cash / Venmo / Other — Mark as Paid */}
        {(method === 'cash' || method === 'venmo') && (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => { setMethod(null); setError(''); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div className="text-center space-y-3 py-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                {method === 'cash' ? <Banknote className="w-8 h-8 text-primary" /> : <Wallet className="w-8 h-8 text-primary" />}
              </div>
              <h3 className="font-semibold text-lg">
                {method === 'cash' ? 'Record Cash Payment' : 'Record Off-Platform Payment'}
              </h3>
              <p className="text-sm text-muted-foreground">
                This records the payment without processing a card. The booking will be marked as paid.
              </p>
            </div>

            {method === 'venmo' && (
              <div className="space-y-2">
                <Label className="text-sm">Payment Note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Venmo @username, Zelle, CashApp"
                  rows={2}
                />
              </div>
            )}

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button className="w-full" onClick={() => handleMarkAsPaid(method)} disabled={processing}>
              {processing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recording...</>
              ) : (
                `Mark $${parseFloat(amount).toFixed(2)} as Paid`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
