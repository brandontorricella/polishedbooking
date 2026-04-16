import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Heart, Check, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function TipPayment() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [presets, setPresets] = useState<number[]>([15, 20, 25]);
  const [selectedPct, setSelectedPct] = useState<number | null>(20);
  const [useCustom, setUseCustom] = useState(false);
  const [customAmt, setCustomAmt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!bookingId || !token) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, business:businesses(name, tip_presets), service:services(name)')
        .eq('id', bookingId)
        .eq('tip_token', token)
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      setBooking(data);
      const biz: any = data.business;
      if (biz?.tip_presets?.length) setPresets(biz.tip_presets);
      setLoading(false);
    })();
  }, [bookingId, token]);

  const serviceAmt = Number(booking?.final_service_amount || booking?.total_price || 0);
  const tipAmt = useCustom
    ? parseFloat(customAmt) || 0
    : selectedPct !== null
    ? Number(((serviceAmt * selectedPct) / 100).toFixed(2))
    : 0;
  const total = serviceAmt + tipAmt;

  const handleSubmit = async () => {
    if (!bookingId || !token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-tip-and-capture', {
        body: { booking_id: bookingId, tip_token: token, tip_amount: tipAmt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDone(true);
      toast.success('Payment complete. Thank you!');
    } catch (e: any) {
      toast.error(e.message || 'Could not process payment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center space-y-2">
          <h1 className="font-display text-xl font-semibold">Link expired</h1>
          <p className="text-sm text-muted-foreground">This tip link is no longer valid. Your appointment may already be completed.</p>
          <Button onClick={() => navigate('/')} className="mt-2">Go home</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Thank you!</h1>
          <p className="text-sm text-muted-foreground">
            We charged ${total.toFixed(2)} to your card on file. A receipt is on its way to your email.
          </p>
          <Button onClick={() => navigate('/bookings')} className="mt-2">View bookings</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2">💝</div>
            <h1 className="font-display text-xl font-semibold">How was your appointment?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add a tip for {booking.business?.name}. 100% goes to your provider.
            </p>
          </div>

          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 text-sm">
            <span className="font-medium">{booking.service?.name}</span>
            <span className="font-semibold">${serviceAmt.toFixed(2)}</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {presets.map((pct) => {
              const amt = ((serviceAmt * pct) / 100).toFixed(2);
              const active = selectedPct === pct && !useCustom;
              return (
                <button
                  key={pct}
                  onClick={() => { setUseCustom(false); setSelectedPct(pct); }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition',
                    active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <span className={cn('text-base font-bold', active && 'text-primary')}>{pct}%</span>
                  <span className="text-xs text-muted-foreground">${amt}</span>
                </button>
              );
            })}
            <button
              onClick={() => { setUseCustom(true); setSelectedPct(null); }}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition',
                useCustom ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <span className={cn('text-base font-bold', useCustom && 'text-primary')}>Custom</span>
              <span className="text-xs text-muted-foreground">$</span>
            </button>
          </div>

          {useCustom && (
            <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-primary bg-primary/5">
              <span className="text-lg font-bold text-primary">$</span>
              <Input
                type="number" min="0" step="0.01" value={customAmt}
                onChange={(e) => setCustomAmt(e.target.value)} placeholder="0.00" autoFocus
                className="border-0 bg-transparent text-xl font-bold text-center focus-visible:ring-0"
              />
            </div>
          )}

          <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>${serviceAmt.toFixed(2)}</span></div>
            <div className="flex justify-between text-primary font-medium"><span>Tip</span><span>+${tipAmt.toFixed(2)}</span></div>
            <div className="flex justify-between pt-2 border-t border-border font-semibold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-gradient-primary" size="lg">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : <><Heart className="w-4 h-4 mr-2" /> Complete payment ${total.toFixed(2)}</>}
            </Button>
            <Button
              variant="ghost"
              onClick={async () => { setUseCustom(false); setSelectedPct(null); setCustomAmt('0'); await new Promise(r => setTimeout(r, 50)); handleSubmit(); }}
              disabled={submitting}
              className="w-full text-muted-foreground"
            >
              No tip — just charge service
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" /> Secured by Stripe
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
