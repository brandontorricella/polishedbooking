import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { BookingWithDetails } from '@/hooks/useBookings';
import { format, parseISO } from 'date-fns';

interface CancelBookingModalProps {
  booking: BookingWithDetails;
  isOpen: boolean;
  onClose: () => void;
  onCanceled: () => void;
}

interface CancellationInfo {
  fee_applies: boolean;
  fee_amount: number;
  deposit_refundable: boolean;
  deposit_forfeited: boolean;
  deposit_amount: number;
  message?: string;
}

const formatTime = (time: string): string => {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
};

export const CancelBookingModal = ({ booking, isOpen, onClose, onCanceled }: CancelBookingModalProps) => {
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [reason, setReason] = useState('');
  const [cancellationInfo, setCancellationInfo] = useState<CancellationInfo | null>(null);

  useEffect(() => {
    if (!isOpen || !session) return;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('cancellation-preview', {
          body: { booking_id: booking.id },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setCancellationInfo(data);
      } catch (err) {
        console.error('Error fetching cancellation preview:', err);
        // Fallback: show as free cancellation
        setCancellationInfo({ fee_applies: false, fee_amount: 0, deposit_refundable: false, deposit_forfeited: false, deposit_amount: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchPreview();
  }, [isOpen, booking.id, session]);

  const handleConfirmCancel = async () => {
    if (!session) return;
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: { booking_id: booking.id, reason, canceled_by: 'customer' },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      toast({
        title: 'Appointment Canceled',
        description: data?.message || 'Your appointment has been canceled.',
      });
      onCanceled();
    } catch (err: any) {
      toast({
        title: 'Cancel failed',
        description: err.message || 'Unable to cancel appointment.',
        variant: 'destructive',
      });
    } finally {
      setCanceling(false);
    }
  };

  const bookingDate = parseISO(booking.booking_date);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Cancel Appointment</DialogTitle>
        </DialogHeader>

        {/* Booking Summary */}
        <Card className="bg-muted/50">
          <CardContent className="p-3">
            <p className="font-semibold text-sm">{booking.business?.name}</p>
            <p className="text-sm text-muted-foreground">
              {booking.service?.name} · {format(bookingDate, 'MMM d, yyyy')} at {formatTime(booking.booking_time)}
            </p>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : cancellationInfo && (
          <>
            {/* Fee Warning */}
            {cancellationInfo.fee_applies ? (
              <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-amber-800 dark:text-amber-400">Cancellation Fee Applies</p>
                  {cancellationInfo.fee_amount > 0 && (
                    <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                      A <strong>${cancellationInfo.fee_amount.toFixed(2)}</strong> cancellation fee will be charged.
                    </p>
                  )}
                  {cancellationInfo.deposit_forfeited && cancellationInfo.deposit_amount > 0 && (
                    <p className="text-sm text-destructive mt-1 font-medium">
                      Your ${cancellationInfo.deposit_amount.toFixed(2)} deposit will not be refunded.
                    </p>
                  )}
                </div>
              </div>
            ) : cancellationInfo.deposit_refundable && cancellationInfo.deposit_amount > 0 ? (
              <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  You're within the free cancellation window. Your <strong>${cancellationInfo.deposit_amount.toFixed(2)} deposit will be refunded</strong> within 5-7 business days.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  This is a free cancellation. No charges will apply.
                </p>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for cancellation (optional)</label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="schedule_conflict">Schedule conflict</SelectItem>
                  <SelectItem value="found_another">Found another provider</SelectItem>
                  <SelectItem value="personal_emergency">Personal emergency</SelectItem>
                  <SelectItem value="price_concern">Price concern</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Keep Appointment
              </Button>
              <Button
                onClick={handleConfirmCancel}
                disabled={canceling}
                className={`flex-1 ${cancellationInfo.fee_applies ? 'bg-amber-600 hover:bg-amber-700' : 'bg-destructive hover:bg-destructive/90'} text-white`}
              >
                {canceling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Canceling...
                  </>
                ) : cancellationInfo.fee_applies && cancellationInfo.fee_amount > 0 ? (
                  `Cancel & Pay $${cancellationInfo.fee_amount.toFixed(2)}`
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
