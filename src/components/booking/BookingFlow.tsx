import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isBefore, startOfToday } from 'date-fns';
import {
  Clock, ChevronLeft, ChevronRight, Check, Loader2, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvailability } from '@/hooks/useAvailability';
import { supabase } from '@/integrations/supabase/client';
import { PaymentAuthorizationStep } from '@/components/booking/PaymentAuthorizationStep';
import { IntakeFormStep } from '@/components/booking/IntakeFormStep';
import { useBusinessPaymentMode } from '@/hooks/useBusinessPaymentMode';
import { Wallet } from 'lucide-react';
import type { Business, Service } from '@/types';
import type { IntakeForm } from '@/hooks/useIntakeForms';
import { cn } from '@/lib/utils';

interface BookingFlowProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  initialService?: Service;
}

type BookingStep = 'service' | 'date' | 'time' | 'confirm' | 'payment' | 'intake';

const formatTime = (time: string): string => {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${(min || 0).toString().padStart(2, '0')} ${period}`;
};

export const BookingFlow = ({ business, isOpen, onClose, initialService }: BookingFlowProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { slots, loading: slotsLoading, noSlots, closedReason, fetchAvailability } = useAvailability();

  const [step, setStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(initialService || null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [intakeForm, setIntakeForm] = useState<IntakeForm | null>(null);
  const [confirmedZero, setConfirmedZero] = useState(false);

  const today = startOfToday();
  const { collectExternally } = useBusinessPaymentMode(business.id);
  const isExternalPay = collectExternally === true;
  const allSteps: BookingStep[] = isExternalPay
    ? ['service', 'date', 'time', 'confirm']
    : ['service', 'date', 'time', 'confirm', 'payment'];

  useEffect(() => {
    if (selectedDate && selectedService) {
      setSelectedTime(null);
      fetchAvailability(business.id, selectedDate, selectedService.id, selectedService.duration, null, business.hours);
    }
  }, [selectedDate, selectedService, business.id, business.hours, fetchAvailability]);

  const checkIntakeForm = async (serviceId: string): Promise<IntakeForm | null> => {
    try {
      const { data: forms } = await supabase.from('intake_forms').select('*').eq('business_id', business.id).eq('is_active', true);
      if (!forms?.length) return null;
      const applicableForm = forms.find(f => {
        const sids = (f as any).service_ids as string[] | null;
        if (sids?.length) return sids.includes(serviceId);
        return true;
      });
      if (!applicableForm) return null;
      if (applicableForm.require_for_new_clients_only && user) {
        const { data: existing } = await supabase.from('intake_form_submissions').select('id').eq('form_id', applicableForm.id).eq('user_id', user.id).limit(1);
        if (existing?.length) return null;
      }
      const { data: questions } = await supabase.from('intake_form_questions').select('*').eq('form_id', applicableForm.id).order('sort_order', { ascending: true });
      return {
        ...applicableForm,
        service_ids: (applicableForm as any).service_ids || [],
        require_for_new_clients_only: applicableForm.require_for_new_clients_only ?? false,
        questions: (questions || []).map(q => ({ ...q, options: q.options || [], is_required: q.is_required ?? false, sort_order: q.sort_order ?? 0 })),
      } as IntakeForm;
    } catch { return null; }
  };

  const finishBooking = (msg: string = '') => {
    toast({ title: 'Booking confirmed!', description: `Your appointment with ${business.name} is confirmed.${msg}` });
    onClose();
    navigate('/bookings');
  };

  const tryShowIntakeOrFinish = async (bookingId: string, msg: string = '') => {
    if (selectedService) {
      const form = await checkIntakeForm(selectedService.id);
      if (form) { setIntakeForm(form); setCreatedBookingId(bookingId); setStep('intake'); return; }
    }
    finishBooking(msg);
  };

  const handleNext = () => {
    const i = allSteps.indexOf(step);
    if (i < allSteps.length - 1) setStep(allSteps[i + 1]);
  };
  const handleBack = () => {
    const i = allSteps.indexOf(step);
    if (i > 0) setStep(allSteps[i - 1]);
  };

  // Create booking row in 'pending' state, returns booking id
  const createPendingBooking = async (): Promise<string | null> => {
    if (!user || !selectedService || !selectedDate || !selectedTime) return null;
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
        status: 'pending',
      } as any)
      .select()
      .single();
    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({ title: 'Time no longer available', description: 'Please pick another time.', variant: 'destructive' });
        if (selectedDate && selectedService) fetchAvailability(business.id, selectedDate, selectedService.id, selectedService.duration, null, business.hours);
        setStep('time'); setSelectedTime(null);
        return null;
      }
      throw error;
    }
    return data.id;
  };

  const handleProceedToPayment = async () => {
    if (!user || !session) {
      toast({ title: 'Sign in required', description: 'Please sign in to book.', variant: 'destructive' });
      navigate('/auth');
      return;
    }
    if (!selectedService || !selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      const id = await createPendingBooking();
      if (!id) return;
      setCreatedBookingId(id);
      if (isExternalPay) {
        // External payment: confirm immediately, no payment step.
        const { error } = await supabase
          .from('bookings')
          .update({ status: 'confirmed', payment_auth_type: 'external' } as any)
          .eq('id', id);
        if (error) throw error;
        await tryShowIntakeOrFinish(id, ` Payment will be collected by ${business.name} at your appointment.`);
      } else {
        setStep('payment');
      }
    } catch (e: any) {
      toast({ title: 'Booking failed', description: e.message, variant: 'destructive' });
    } finally { setIsSubmitting(false); }
  };

  // Card authorized — save PM ID + customer to booking & confirm
  const handleCardAuthorized = async ({ paymentMethodId, customerId }: { paymentMethodId: string; customerId: string }) => {
    if (!createdBookingId) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_method_id: paymentMethodId,
          stripe_customer_id: customerId,
          payment_auth_type: 'card_setup',
          status: 'confirmed',
        } as any)
        .eq('id', createdBookingId);
      if (error) throw error;
      setConfirmedZero(true);
      await tryShowIntakeOrFinish(createdBookingId, ' Card saved — you will not be charged until after your appointment.');
    } catch (e: any) {
      toast({ title: 'Could not save payment', description: e.message, variant: 'destructive' });
    }
  };

  const handleBnplSelected = async (provider: 'afterpay_clearpay' | 'klarna' | 'affirm') => {
    if (!createdBookingId || !session || !selectedService) return;
    try {
      const { data, error } = await supabase.functions.invoke('create-bnpl-checkout', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          booking_id: createdBookingId,
          business_id: business.id,
          amount: selectedService.price,
          provider,
          service_name: selectedService.name,
        },
      });
      if (error) throw error;
      // Mark provider before redirect
      await supabase
        .from('bookings')
        .update({ payment_auth_type: 'bnpl_paid', bnpl_provider: provider } as any)
        .eq('id', createdBookingId);
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: 'Could not start BNPL', description: e.message, variant: 'destructive' });
    }
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

  const showNavButtons = step !== 'payment' && step !== 'intake';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Book with {business.name}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 py-4">
          {allSteps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step === s ? 'bg-primary text-primary-foreground' :
                allSteps.indexOf(step) > i ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {allSteps.indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < allSteps.length - 1 && (
                <div className={cn('w-8 h-0.5 mx-1', allSteps.indexOf(step) > i ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[55vh]">
          <AnimatePresence mode="wait">
            {step === 'service' && (
              <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">Select a service</h3>
                {business.services.map((service) => (
                  <div key={service.id} onClick={() => setSelectedService(service)}
                    className={cn('p-4 rounded-xl border cursor-pointer transition',
                      selectedService?.id === service.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/50')}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" /><span>{service.duration} min</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">${service.price}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 'date' && (
              <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="flex justify-center">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={isDateDisabled} className="rounded-md border pointer-events-auto" />
                </div>
              </motion.div>
            )}

            {step === 'time' && (
              <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">
                  Available times for {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                {slotsLoading ? (
                  <div className="flex flex-col items-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : noSlots ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">😔 {closedReason || (selectedDate?.toDateString() === today.toDateString() ? 'No times available today.' : 'No available times on this date.')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <Button key={slot.start_time} variant={selectedTime === slot.start_time ? 'default' : 'outline'} size="sm"
                        onClick={() => setSelectedTime(slot.start_time)}
                        className={cn('h-10', selectedTime === slot.start_time && 'bg-gradient-primary')}>
                        {formatTime(slot.start_time)}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground">Booking summary</h3>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedDate && format(selectedDate, 'EEE, MMM d, yyyy')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTime && formatTime(selectedTime)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{selectedService?.duration} min</span></div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-semibold">Service total</span><span className="font-semibold text-lg">${selectedService?.price}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    <span>Charged today</span><span>$0.00</span>
                  </div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Your card will not be charged until after your appointment is complete.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special requests..."
                    className="mt-2 w-full p-3 rounded-lg border border-border bg-background resize-none focus:ring-2 focus:ring-primary"
                    rows={3} />
                </div>
              </motion.div>
            )}

            {step === 'payment' && createdBookingId && selectedService && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PaymentAuthorizationStep
                  bookingId={createdBookingId}
                  business={business}
                  service={selectedService}
                  onAuthorized={handleCardAuthorized}
                  onBnplSelected={handleBnplSelected}
                />
              </motion.div>
            )}

            {step === 'intake' && intakeForm && createdBookingId && (
              <IntakeFormStep
                form={intakeForm}
                bookingId={createdBookingId}
                businessName={business.name}
                onCompleted={() => finishBooking()}
                onSkip={() => finishBooking()}
              />
            )}
          </AnimatePresence>
        </div>

        {showNavButtons && (
          <div className="flex gap-3 pt-4 border-t border-border">
            {step !== 'service' && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            {step === 'confirm' ? (
              <Button onClick={handleProceedToPayment} disabled={isSubmitting} className="flex-1 bg-gradient-primary">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Reserving…</> : 'Continue to payment'}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 bg-gradient-primary">
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
