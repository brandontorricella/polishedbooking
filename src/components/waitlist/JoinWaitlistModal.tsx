import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CalendarDays, X, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientWaitlist } from '@/hooks/useWaitlist';

interface JoinWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  businessName: string;
  services?: { id: string; name: string }[];
  preselectedServiceId?: string | null;
  onSuccess?: () => void;
}

export const JoinWaitlistModal = ({
  open, onOpenChange, businessId, businessName, services, preselectedServiceId, onSuccess,
}: JoinWaitlistModalProps) => {
  const { joinWaitlist } = useClientWaitlist();
  const [serviceId, setServiceId] = useState(preselectedServiceId || '');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeStart, setTimeStart] = useState('09:00');
  const [timeEnd, setTimeEnd] = useState('17:00');
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    const success = await joinWaitlist({
      business_id: businessId,
      service_id: serviceId || null,
      preferred_date: preferredDate || null,
      preferred_time_start: timeStart,
      preferred_time_end: timeEnd,
      flexible_dates: flexibleDates,
      notes: notes.trim() || undefined,
    });
    setSubmitting(false);
    if (success) {
      onSuccess?.();
      onOpenChange(false);
      // Reset form
      setServiceId('');
      setPreferredDate('');
      setTimeStart('09:00');
      setTimeEnd('17:00');
      setFlexibleDates(true);
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-primary" /> Join Waitlist
          </DialogTitle>
          <DialogDescription>
            We'll notify you when a spot opens at {businessName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Service selector */}
          {services && services.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Service (optional)</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Any service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any service</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Preferred date */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" /> Preferred Date (optional)
            </Label>
            <Input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={today}
              className="h-9"
            />
          </div>

          {/* Time range */}
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Preferred Time Range
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                className="h-9 flex-1"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                className="h-9 flex-1"
              />
            </div>
          </div>

          {/* Flexible dates */}
          <div className="flex items-center gap-2">
            <Switch
              id="flexible-dates"
              checked={flexibleDates}
              onCheckedChange={setFlexibleDates}
            />
            <Label htmlFor="flexible-dates" className="text-sm cursor-pointer">
              I'm flexible on dates
            </Label>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preferences or details..."
              rows={2}
              className="resize-none text-sm"
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground"
          >
            {submitting ? 'Joining...' : 'Join Waitlist'}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Expires after 30 days · You can leave anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
