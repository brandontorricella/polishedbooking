import { useState } from 'react';
import { Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    total_price: number;
    final_service_amount?: number | null;
    payment_auth_type?: string | null;
    bnpl_provider?: string | null;
    service?: { name: string } | null;
    client?: { display_name?: string | null; email?: string } | null;
  };
  onCompleted: () => void;
}

export const CompleteAppointmentModal = ({ open, onOpenChange, booking, onCompleted }: Props) => {
  const { session } = useAuth();
  const initial = booking.final_service_amount ?? booking.total_price ?? 0;
  const [amount, setAmount] = useState(String(initial));
  const [sendTipRequest, setSendTipRequest] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isBnpl = booking.payment_auth_type === 'bnpl_paid';

  const handleConfirm = async () => {
    const finalAmt = parseFloat(amount);
    if (!finalAmt || finalAmt <= 0) {
      toast.error('Enter a valid service amount');
      return;
    }
    if (!session) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('complete-appointment', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { booking_id: booking.id, final_amount: finalAmt, send_tip_request: sendTipRequest && !isBnpl },
      });
      if (error) throw error;
      if (data?.status === 'awaiting_payment') {
        toast.success('Appointment marked complete. Tip request sent to client.');
      } else if (data?.status === 'completed') {
        toast.success('Appointment completed and payment captured.');
      } else {
        toast.success('Appointment completed.');
      }
      onCompleted();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to complete appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Complete Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="text-muted-foreground">Client:</span> <span className="font-medium">{booking.client?.display_name || 'Client'}</span></p>
            <p><span className="text-muted-foreground">Service:</span> <span className="font-medium">{booking.service?.name || 'Service'}</span></p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="final-amount">Final service amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-muted-foreground">$</span>
              <Input
                id="final-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <p className="text-xs text-muted-foreground">Adjust if there were upsells, add-ons, or changes.</p>
          </div>

          {isBnpl ? (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-sm">
              <p className="text-blue-800 dark:text-blue-300 font-medium">BNPL booking ({booking.bnpl_provider})</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Service was paid at booking. Tips are not collected for BNPL bookings.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <Switch checked={sendTipRequest} onCheckedChange={setSendTipRequest} id="tip-toggle" />
              <div className="flex-1">
                <Label htmlFor="tip-toggle" className="cursor-pointer flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> Send tip request
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Client gets an email + in-app notification to add a tip. If they don't respond within 24h, we charge the service amount only.
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-gradient-primary"
            size="lg"
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : 'Confirm and Send'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
