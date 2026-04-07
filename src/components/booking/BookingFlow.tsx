import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isBefore, startOfToday } from 'date-fns';
import { 
  Clock, ChevronLeft, ChevronRight, Check, Loader2, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvailability } from '@/hooks/useAvailability';
import { supabase } from '@/integrations/supabase/client';
import { DepositPaymentStep } from '@/components/booking/DepositPaymentStep';
import { CancellationPolicyDisplay } from '@/components/booking/CancellationPolicyDisplay';
import type { Business, Service } from '@/types';
import { cn } from '@/lib/utils';

interface BookingFlowProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  initialService?: Service;
}

type BookingStep = 'service' | 'date' | 'time' | 'confirm' | 'deposit';

const formatTime = (time: string): string => {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${(min || 0).toString().padStart(2, '0')} ${period}`;
};

export const BookingFlow = ({ business, isOpen, onClose, initialService }: BookingFlowProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { slots, loading: slotsLoading, noSlots, closedReason, fetchAvailability } = useAvailability();
  
  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const businessAny = business as any;
  const depositRequired = businessAny.deposit_required || false;

  const today = startOfToday();

  const allSteps: BookingStep[] = depositRequired 
    ? ['service', 'date', 'time', 'confirm', 'deposit']
    : ['service', 'date', 'time', 'confirm'];

  // Fetch availability when date changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      setSelectedTime(null);
      fetchAvailability(
        business.id,
        selectedDate,
        selectedService.id,
        selectedService.duration,
        null,
        business.hours,
      );
    }
  }, [selectedDate, selectedService, business.id, business.hours, fetchAvailability]);

  const handleNext = () => {
    const currentIndex = allSteps.indexOf(step);
    if (currentIndex < allSteps.length - 1) {
      setStep(allSteps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = allSteps.indexOf(step);
    if (currentIndex > 0) {
      setStep(allSteps[currentIndex - 1]);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to book an appointment.", variant: "destructive" });
      navigate('/auth');
      return;
    }

    if (!selectedService || !selectedDate || !selectedTime) {
      toast({ title: "Missing information", description: "Please select a service, date, and time.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const depositAmt = depositRequired
        ? (businessAny.deposit_type === 'percentage'
          ? (selectedService.price * (businessAny.deposit_amount || 25)) / 100
          : (businessAny.deposit_amount || 25))
        : 0;

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          business_id: business.id,
          service_id: selectedService.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          total_price: selectedService.price,
          notes: notes || null,
          status: depositRequired ? 'pending' : 'confirmed',
          deposit_amount: depositAmt,
          remaining_balance: selectedService.price - depositAmt,
        })
        .select()
        .single();

      if (error) {
        // Check for potential double-booking
        if (error.message?.includes('duplicate') || error.code === '23505') {
          toast({ title: "Time no longer available", description: "This time slot was just booked. Please select a different time.", variant: "destructive" });
          // Refresh availability
          if (selectedDate && selectedService) {
            fetchAvailability(business.id, selectedDate, selectedService.id, selectedService.duration, null, business.hours);
          }
          setStep('time');
          setSelectedTime(null);
          return;
        }
        throw error;
      }

      if (depositRequired) {
        setCreatedBookingId(data.id);
        setStep('deposit');
      } else {
        toast({ title: "Booking confirmed!", description: `Your appointment with ${business.name} is confirmed.` });
        onClose();
        navigate('/bookings');
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({ title: "Booking failed", description: error.message || "Unable to complete booking.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDepositComplete = () => {
    toast({ title: "Booking confirmed!", description: `Your deposit has been received. Appointment confirmed!` });
    onClose();
    navigate('/bookings');
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, today)) return true;
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    return !business.hours[day as keyof typeof business.hours];
  };

  const canProceed = () => {
    switch (step) {
      case 'service': return !!selectedService;
      case 'date': return !!selectedDate;
      case 'time': return !!selectedTime;
      case 'confirm': return true;
      default: return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Book with {business.name}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          {allSteps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                step === s ? "bg-primary text-primary-foreground" :
                allSteps.indexOf(step) > i 
                  ? "bg-primary/20 text-primary" 
                  : "bg-muted text-muted-foreground"
              )}>
                {allSteps.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < allSteps.length - 1 && (
                <div className={cn("w-8 h-0.5 mx-1", allSteps.indexOf(step) > i ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            {/* Step 1: Select Service */}
            {step === 'service' && (
              <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Select a Service</h3>
                {business.services.map((service) => (
                  <div
                    key={service.id}
                    className={cn(
                      "p-4 rounded-xl border cursor-pointer transition-all",
                      selectedService?.id === service.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{service.duration} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${service.price}</p>
                        {selectedService?.id === service.id && <Check className="w-5 h-5 text-primary mt-1 ml-auto" />}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 2: Select Date */}
            {step === 'date' && (
              <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                {selectedService && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                    <span>{selectedService.name}</span>
                    <span>·</span>
                    <span>{selectedService.duration} min</span>
                    <span>·</span>
                    <span>${selectedService.price}</span>
                  </div>
                )}
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={isDateDisabled}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Time — uses real availability */}
            {step === 'time' && (
              <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Available Times for {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                </h3>

                {slotsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Checking availability...</p>
                  </div>
                ) : noSlots ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">😔 {closedReason || 'No available times on this date.'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Please try a different day.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <Button
                        key={slot.start_time}
                        variant={selectedTime === slot.start_time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(slot.start_time)}
                        className={cn("h-10", selectedTime === slot.start_time && "bg-gradient-primary")}
                      >
                        {formatTime(slot.start_time)}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Booking Summary</h3>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime && formatTime(selectedTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{selectedService?.duration} min</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-semibold text-lg">${selectedService?.price}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    className="mt-2 w-full p-3 rounded-lg border border-border bg-background resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 5: Deposit */}
            {step === 'deposit' && createdBookingId && selectedService && (
              <motion.div key="deposit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <DepositPaymentStep
                  bookingId={createdBookingId}
                  business={business}
                  service={selectedService}
                  onPaymentComplete={handleDepositComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        {step !== 'deposit' && (
          <div className="flex gap-3 pt-4 border-t border-border">
            {step !== 'service' && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step !== 'confirm' ? (
              <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 bg-gradient-primary">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleConfirmBooking} disabled={isSubmitting} className="flex-1 bg-gradient-primary">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking...</>
                ) : depositRequired ? (
                  <><CreditCard className="w-4 h-4 mr-1" /> Continue to Deposit</>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
