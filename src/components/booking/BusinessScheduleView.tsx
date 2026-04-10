import { useState, useEffect, useCallback } from 'react';
import { format, addDays, parseISO, startOfToday, isSameDay } from 'date-fns';
import { Calendar, Clock, User, Scissors, ChevronLeft, ChevronRight, Loader2, Phone, Mail, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CollectPaymentModal } from './CollectPaymentModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ClientInfo {
  display_name: string | null;
  email: string;
  phone: string | null;
  profile_photo_url: string | null;
}

interface BusinessBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  client_id: string;
  staff_id: string | null;
  client?: ClientInfo | null;
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
    category: string | null;
  } | null;
  staff: {
    id: string;
    name: string;
    profile_photo_url: string | null;
  } | null;
}

interface BusinessScheduleViewProps {
  businessId: string;
}

const statusStyles: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  completed: 'bg-muted text-muted-foreground border-border',
  canceled: 'bg-destructive/10 text-destructive border-destructive/20',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export const BusinessScheduleView = ({ businessId }: BusinessScheduleViewProps) => {
  const [bookings, setBookings] = useState<BusinessBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(startOfToday());
  const [selectedDay, setSelectedDay] = useState(startOfToday());
  const [collectPaymentBooking, setCollectPaymentBooking] = useState<BusinessBooking | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    const start = format(weekStart, 'yyyy-MM-dd');
    const end = format(addDays(weekStart, 6), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, booking_date, booking_time, status, total_price, notes, client_id, staff_id,
        service:services(id, name, duration, price, category),
        staff:staff_members(id, name, profile_photo_url)
      `)
      .eq('business_id', businessId)
      .gte('booking_date', start)
      .lte('booking_date', end)
      .in('status', ['confirmed', 'pending'])
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (!error && data) {
      const mapped = (data as any[]).map(b => ({
        ...b,
        service: Array.isArray(b.service) ? b.service[0] || null : b.service,
        staff: Array.isArray(b.staff) ? b.staff[0] || null : b.staff,
      }));

      // Fetch client profiles separately
      const clientIds = [...new Set(mapped.map(b => b.client_id).filter(Boolean))];
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, phone, profile_photo_url')
          .in('user_id', clientIds);

        const profileMap = new Map(
          (profiles || []).map(p => [p.user_id, p])
        );
        mapped.forEach(b => {
          b.client = profileMap.get(b.client_id) || null;
        });
      }

      setBookings(mapped);
    } else {
      setBookings([]);
    }
    setIsLoading(false);
  }, [businessId, weekStart]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const dayBookings = bookings.filter(b =>
    isSameDay(parseISO(b.booking_date), selectedDay)
  );

  const getBookingCountForDay = (day: Date) =>
    bookings.filter(b => isSameDay(parseISO(b.booking_date), day)).length;

  const servicesNeeded = Array.from(
    new Map(
      dayBookings
        .filter(b => b.service)
        .map(b => [b.service!.id, b.service!])
    ).values()
  );

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => addDays(prev, -7))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-display font-semibold text-lg">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setWeekStart(prev => addDays(prev, 7))}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map(day => {
          const count = getBookingCountForDay(day);
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, startOfToday());

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'flex flex-col items-center p-2 sm:p-3 rounded-xl transition-all text-center',
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-card border border-border hover:border-primary/40',
                isToday && !isSelected && 'ring-2 ring-primary/30'
              )}
            >
              <span className="text-[10px] sm:text-xs font-medium uppercase opacity-70">
                {format(day, 'EEE')}
              </span>
              <span className="text-lg sm:text-xl font-bold">{format(day, 'd')}</span>
              {count > 0 && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[10px] px-1.5 py-0 mt-1',
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary/10 text-primary'
                  )}
                >
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Services Needed Summary */}
      {dayBookings.length > 0 && servicesNeeded.length > 0 && (
        <Card className="p-4 bg-accent/30 border-accent">
          <div className="flex items-center gap-2 mb-2">
            <Scissors className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">Materials Needed for {format(selectedDay, 'EEEE')}</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {servicesNeeded.map(s => {
              const count = dayBookings.filter(b => b.service?.id === s.id).length;
              return (
                <Badge key={s.id} variant="outline" className="text-xs">
                  {s.name} {s.category && `(${s.category})`} × {count}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : dayBookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">No appointments on {format(selectedDay, 'EEEE, MMM d')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayBookings.map(booking => (
            <Card key={booking.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Time */}
                <div className="shrink-0 text-center min-w-[60px]">
                  <div className="text-sm font-bold text-primary">{formatTime(booking.booking_time)}</div>
                  {booking.service && (
                    <div className="text-[11px] text-muted-foreground">{booking.service.duration} min</div>
                  )}
                </div>

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={booking.client?.profile_photo_url || ''} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {(booking.client?.display_name || booking.client?.email || '?')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {booking.client?.display_name || booking.client?.email?.split('@')[0] || 'Guest'}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {booking.client?.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{booking.client.email}</span>
                          </span>
                        )}
                        {booking.client?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" />
                            {booking.client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex items-center flex-wrap gap-2">
                    {booking.service && (
                      <Badge variant="secondary" className="text-xs">
                        <Scissors className="w-3 h-3 mr-1" />
                        {booking.service.name}
                      </Badge>
                    )}
                    {booking.staff && (
                      <Badge variant="outline" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        {booking.staff.name}
                      </Badge>
                    )}
                    <Badge className={cn('text-xs border', statusStyles[booking.status || 'pending'])}>
                      {booking.status}
                    </Badge>
                  </div>

                  {booking.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic line-clamp-2">
                      📝 {booking.notes}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="shrink-0 text-right">
                  <span className="font-bold text-sm">${booking.total_price}</span>
                </div>
              </div>
            </Card>
          ))}

          {/* Day Summary */}
          <div className="flex items-center justify-between px-2 pt-2 border-t border-border text-sm">
            <span className="text-muted-foreground">
              {dayBookings.length} appointment{dayBookings.length !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold">
              Total: ${dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
