import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronLeft, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ServiceBundle } from '@/hooks/useServiceBundles';
import type { Business } from '@/types';

interface BundleBookingFlowProps {
  bundle: ServiceBundle;
  business: Business;
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'summary' | 'date' | 'time' | 'confirm';

const generateTimeSlots = (openTime: string, closeTime: string, totalDuration: number): string[] => {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  for (let m = openMinutes; m + totalDuration <= closeMinutes; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
  }
  return slots;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

export const BundleBookingFlow = ({ bundle, business, isOpen, onClose }: BundleBookingFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('summary');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof business.hours;
  };

  const getTimeSlotsForDate = (date: Date) => {
    const dayName = getDayName(date);
    const hours = business.hours[dayName];
    if (!hours) return [];
    return generateTimeSlots(hours.open, hours.close, bundle.total_duration);
  };

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    const dayName = getDayName(date);
    return !business.hours[dayName];
  };

  const handleConfirm = async () => {
    if (!user || !selectedDate || !selectedTime) return;
    setIsBooking(true);
    try {
      // Create booking with the first service as primary
      const primaryService = bundle.items[0]?.service;
      if (!primaryService) throw new Error('No services in bundle');

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          business_id: business.id,
          service_id: primaryService.id,
          booking_date: selectedDate.toISOString().split('T')[0],
          booking_time: selectedTime,
          total_price: bundle.final_total,
          status: 'confirmed',
          notes: notes ? `[Bundle: ${bundle.name}] ${notes}` : `[Bundle: ${bundle.name}]`,
        })
        .select()
        .single();

      if (error) throw error;

      // Create bundle booking record
      const { error: bbError } = await supabase
        .from('bundle_bookings')
        .insert({
          booking_id: booking.id,
          bundle_id: bundle.id,
          original_total: bundle.original_total,
          discount_applied: bundle.discount_amount,
          final_total: bundle.final_total,
        });

      if (bbError) console.error('Bundle booking record error:', bbError);

      toast({ title: 'Bundle booked!', description: `${bundle.name} on ${selectedDate.toLocaleDateString()}` });
      onClose();
      navigate('/bookings');
    } catch (err) {
      console.error(err);
      toast({ title: 'Booking failed', description: 'Please try again.', variant: 'destructive' });
    } finally {
      setIsBooking(false);
    }
  };

  const steps: Step[] = ['summary', 'date', 'time', 'confirm'];
  const currentIndex = steps.indexOf(step);

  const handleBack = () => {
    if (currentIndex > 0) setStep(steps[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setStep(steps[currentIndex + 1]);
  };

  const canProceed = () => {
    switch (step) {
      case 'summary': return true;
      case 'date': return !!selectedDate;
      case 'time': return !!selectedTime;
      case 'confirm': return true;
      default: return false;
    }
  };

  const resetAndClose = () => {
    setStep('summary');
    setSelectedDate(undefined);
    setSelectedTime('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Book {bundle.name}
          </DialogTitle>
          <DialogDescription>
            {bundle.items.length} services • {bundle.total_duration} min • ${bundle.final_total.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {steps.map((s, i) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${i <= currentIndex ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'summary' && (
              <div className="space-y-3">
                <h3 className="font-semibold">What's Included</h3>
                {bundle.items.map((item, i) => (
                  <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">{i + 1}</span>
                      <span>{item.service.name}</span>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <span>{item.service.duration} min • ${Number(item.service.price).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border space-y-1">
                  {bundle.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="line-through text-muted-foreground">${bundle.original_total.toFixed(2)}</span>
                    </div>
                  )}
                  {bundle.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Bundle Discount</span>
                      <span>-${bundle.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${bundle.final_total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {step === 'date' && (
              <div>
                <h3 className="font-semibold mb-3">Select Date</h3>
                <CalendarPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setSelectedTime(''); }}
                  disabled={isDateDisabled}
                  className="rounded-xl border mx-auto"
                />
              </div>
            )}

            {step === 'time' && selectedDate && (
              <div>
                <h3 className="font-semibold mb-3">Select Start Time</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Total duration: {bundle.total_duration} min
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {getTimeSlotsForDate(selectedDate).map(time => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? 'default' : 'outline'}
                      size="sm"
                      className={selectedTime === time ? 'bg-gradient-primary' : ''}
                      onClick={() => setSelectedTime(time)}
                    >
                      {formatTime(time)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                <h3 className="font-semibold">Confirm Booking</h3>
                <div className="space-y-2 p-4 bg-muted/50 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bundle</span>
                    <span className="font-medium">{bundle.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime && formatTime(selectedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{bundle.total_duration} min</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold">${bundle.final_total.toFixed(2)}</span>
                  </div>
                </div>
                <Textarea
                  placeholder="Any notes for the stylist? (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-2 mt-4">
          {currentIndex > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          {step === 'confirm' ? (
            <Button
              className="flex-1 bg-gradient-primary hover:opacity-90"
              onClick={handleConfirm}
              disabled={isBooking || !user}
            >
              {isBooking ? 'Booking...' : `Confirm - $${bundle.final_total.toFixed(2)}`}
            </Button>
          ) : (
            <Button
              className="flex-1 bg-gradient-primary hover:opacity-90"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
