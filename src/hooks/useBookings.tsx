import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import type { BookingStatus } from '@/types';

export interface BookingWithDetails {
  id: string;
  client_id: string;
  business_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  business?: {
    id: string;
    name: string;
    profile_photo_url: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export const useBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          business:businesses(id, name, profile_photo_url, address, city, state),
          service:services(id, name, duration, price)
        `)
        .eq('client_id', user.id)
        .order('booking_date', { ascending: false });

      if (fetchError) throw fetchError;

      setBookings(data as unknown as BookingWithDetails[]);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'canceled' as BookingStatus })
        .eq('id', bookingId)
        .eq('client_id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Appointment canceled",
        description: "Your appointment has been canceled successfully.",
      });

      // Refresh bookings
      await fetchBookings();
      return true;
    } catch (err: any) {
      console.error('Error canceling booking:', err);
      toast({
        title: "Cancel failed",
        description: err.message || "Unable to cancel appointment. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const getUpcomingBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b =>
      (b.status === 'confirmed' || b.status === 'pending' || b.status === 'in_progress' || b.status === 'awaiting_payment') &&
      b.booking_date >= today
    );
  };

  const getPastBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b =>
      b.status === 'completed' ||
      b.status === 'canceled' ||
      (b.booking_date < today && b.status !== 'awaiting_payment')
    );
  };

  return {
    bookings,
    isLoading,
    error,
    fetchBookings,
    cancelBooking,
    getUpcomingBookings,
    getPastBookings,
  };
};
