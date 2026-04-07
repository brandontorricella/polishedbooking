import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AvailableSlot {
  start_time: string;
  available: boolean;
}

interface AvailabilityResult {
  available_slots: AvailableSlot[];
  reason?: string;
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function useAvailability() {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [noSlots, setNoSlots] = useState(false);
  const [closedReason, setClosedReason] = useState<string | null>(null);

  const fetchAvailability = useCallback(async (
    businessId: string,
    date: Date,
    serviceId: string,
    serviceDuration: number,
    staffId?: string | null,
    businessHours?: Record<string, any> | null,
  ) => {
    setLoading(true);
    setSlots([]);
    setNoSlots(false);
    setClosedReason(null);

    try {
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();

      // 1. Check business_availability table first
      const { data: bizAvail } = await supabase
        .from('business_availability')
        .select('*')
        .eq('business_id', businessId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      let openTime: string;
      let closeTime: string;

      if (bizAvail) {
        if (!bizAvail.is_open) {
          setNoSlots(true);
          setClosedReason('Business closed on this day');
          setLoading(false);
          return;
        }
        openTime = bizAvail.open_time || '09:00';
        closeTime = bizAvail.close_time || '18:00';
      } else if (businessHours) {
        // Fall back to business.hours JSON
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayKey = dayNames[dayOfWeek];
        const dayHours = businessHours[dayKey];
        if (!dayHours) {
          setNoSlots(true);
          setClosedReason('Business closed on this day');
          setLoading(false);
          return;
        }
        openTime = dayHours.open || '09:00';
        closeTime = dayHours.close || '18:00';
      } else {
        openTime = '09:00';
        closeTime = '18:00';
      }

      // 2. Check staff schedule if staff selected
      if (staffId) {
        const { data: staffSched } = await supabase
          .from('staff_schedules')
          .select('*')
          .eq('staff_id', staffId)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();

        if (staffSched) {
          if (!staffSched.is_available) {
            setNoSlots(true);
            setClosedReason('Staff member not available on this day');
            setLoading(false);
            return;
          }
          openTime = staffSched.start_time || openTime;
          closeTime = staffSched.end_time || closeTime;
        }
      }

      // 3. Get existing bookings for conflicts
      let bookingQuery = supabase
        .from('bookings')
        .select('booking_time, service:services(duration)')
        .eq('business_id', businessId)
        .eq('booking_date', dateStr)
        .in('status', ['pending', 'confirmed']);

      if (staffId) {
        bookingQuery = bookingQuery.eq('staff_id', staffId);
      }

      const { data: existingBookings } = await bookingQuery;

      // 4. Get time blocks
      let blockQuery = supabase
        .from('time_blocks')
        .select('*')
        .eq('business_id', businessId)
        .eq('block_date', dateStr);

      const { data: timeBlocks } = await blockQuery;

      // Filter blocks relevant to this staff
      const relevantBlocks = (timeBlocks || []).filter(block => {
        if (staffId) {
          return block.staff_id === staffId || block.staff_id === null;
        }
        return block.staff_id === null;
      });

      // 5. Generate available slots
      const openMin = timeToMinutes(openTime);
      const closeMin = timeToMinutes(closeTime);
      const available: AvailableSlot[] = [];

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();

      for (let startMin = openMin; startMin + serviceDuration <= closeMin; startMin += 15) {
        const endMin = startMin + serviceDuration;
        const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;

        // Check past times (30 min buffer)
        if (isToday && startMin <= now.getHours() * 60 + now.getMinutes() + 30) {
          continue;
        }

        // Check booking conflicts
        const hasBookingConflict = (existingBookings || []).some((b: any) => {
          const bStart = timeToMinutes(b.booking_time);
          const svc = Array.isArray(b.service) ? b.service[0] : b.service;
          const bDuration = svc?.duration || 60;
          const bEnd = bStart + bDuration;
          return startMin < bEnd && endMin > bStart;
        });

        // Check block conflicts
        const hasBlockConflict = relevantBlocks.some(block => {
          if (block.is_all_day) return true;
          const bStart = timeToMinutes(block.start_time);
          const bEnd = timeToMinutes(block.end_time);
          return startMin < bEnd && endMin > bStart;
        });

        if (!hasBookingConflict && !hasBlockConflict) {
          available.push({ start_time: startTime, available: true });
        }
      }

      setSlots(available);
      setNoSlots(available.length === 0);
      if (available.length === 0 && !closedReason) {
        setClosedReason('No available times on this date');
      }
    } catch (err) {
      console.error('Availability check error:', err);
      setSlots([]);
      setNoSlots(true);
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, noSlots, closedReason, fetchAvailability };
}
