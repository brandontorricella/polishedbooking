import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ReviewWithClient {
  id: string;
  business_id: string;
  client_id: string;
  booking_id: string | null;
  rating: number;
  text: string | null;
  is_anonymous: boolean | null;
  is_flagged: boolean | null;
  is_removed: boolean | null;
  business_reply: string | null;
  business_reply_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string | null;
    profile_photo_url: string | null;
  };
  service_name?: string | null;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
}

type SortOption = 'newest' | 'highest' | 'lowest';

export const useReviews = (businessId?: string) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithClient[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [sort, setSort] = useState<SortOption>('newest');

  const fetchReviews = useCallback(async () => {
    if (!businessId) return;

    try {
      const orderCol = sort === 'newest' ? 'created_at' : 'rating';
      const ascending = sort === 'lowest';

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order(orderCol, { ascending });

      if (error) throw error;

      // Filter out removed reviews client-side
      const visible = (data || []).filter(r => !r.is_removed);

      // Fetch profile data for each review
      const reviewsWithProfiles: ReviewWithClient[] = await Promise.all(
        visible.map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, profile_photo_url')
            .eq('user_id', review.client_id)
            .maybeSingle();

          // If review is linked to a booking, get service name
          let serviceName: string | null = null;
          if (review.booking_id) {
            const { data: bookingData } = await supabase
              .from('bookings')
              .select('service_id')
              .eq('id', review.booking_id)
              .maybeSingle();
            if (bookingData?.service_id) {
              const { data: serviceData } = await supabase
                .from('services')
                .select('name')
                .eq('id', bookingData.service_id)
                .maybeSingle();
              serviceName = serviceData?.name || null;
            }
          }

          return {
            ...review,
            profiles: profileData || undefined,
            service_name: serviceName,
          } as ReviewWithClient;
        })
      );

      setReviews(reviewsWithProfiles);

      // Calculate stats
      if (reviewsWithProfiles.length > 0) {
        const total = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0);
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviewsWithProfiles.forEach(r => distribution[r.rating]++);

        setStats({
          averageRating: total / reviewsWithProfiles.length,
          reviewCount: reviewsWithProfiles.length,
          ratingDistribution: distribution,
        });
      } else {
        setStats({
          averageRating: 0,
          reviewCount: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId, sort]);

  // Check if user can review (has completed booking without review)
  const checkCanReview = useCallback(async () => {
    if (!user || !businessId || profile?.role === 'business') {
      setCanReview(false);
      return;
    }

    try {
      // Get completed bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .eq('status', 'completed');

      if (!bookings || bookings.length === 0) {
        setCanReview(false);
        return;
      }

      // Check if any completed booking doesn't have a review
      const bookingIds = bookings.map(b => b.id);
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('booking_id')
        .eq('client_id', user.id)
        .eq('business_id', businessId);

      const reviewedBookingIds = new Set((existingReviews || []).map(r => r.booking_id));
      const unreviewedBooking = bookingIds.find(id => !reviewedBookingIds.has(id));
      setCanReview(!!unreviewedBooking);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    }
  }, [user, businessId, profile?.role]);

  // Create a review linked to a specific booking
  const createReview = useCallback(async (rating: number, text?: string, bookingId?: string) => {
    if (!user || !businessId) {
      return { error: new Error('Not authenticated') };
    }

    if (rating < 1 || rating > 5) {
      return { error: new Error('Rating must be between 1 and 5') };
    }

    // If no bookingId, find an unreviewed completed booking
    let targetBookingId = bookingId;
    if (!targetBookingId) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .eq('status', 'completed');

      if (bookings && bookings.length > 0) {
        const { data: existingReviews } = await supabase
          .from('reviews')
          .select('booking_id')
          .eq('client_id', user.id)
          .eq('business_id', businessId);

        const reviewedIds = new Set((existingReviews || []).map(r => r.booking_id));
        const unreviewed = bookings.find(b => !reviewedIds.has(b.id));
        targetBookingId = unreviewed?.id;
      }
    }

    try {
      const insertData: Record<string, unknown> = {
        client_id: user.id,
        business_id: businessId,
        rating,
        text: text?.trim() || null,
      };
      if (targetBookingId) {
        insertData.booking_id = targetBookingId;
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });

      await fetchReviews();
      setCanReview(false);

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review.',
        variant: 'destructive',
      });
      return { error };
    }
  }, [user, businessId, toast, fetchReviews]);

  // Business reply to a review
  const replyToReview = useCallback(async (reviewId: string, reply: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          business_reply: reply.trim(),
          business_reply_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) throw error;

      toast({ title: 'Reply posted' });
      await fetchReviews();
      return { error: null };
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return { error };
    }
  }, [user, toast, fetchReviews]);

  // Delete business reply
  const deleteReply = useCallback(async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ business_reply: null, business_reply_at: null })
        .eq('id', reviewId);

      if (error) throw error;
      toast({ title: 'Reply deleted' });
      await fetchReviews();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [toast, fetchReviews]);

  // Flag a review
  const flagReview = useCallback(async (reviewId: string, reason: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_flagged: true,
          flag_reason: reason,
          flagged_by: user.id,
        })
        .eq('id', reviewId);

      if (error) throw error;
      toast({ title: 'Review reported', description: 'Our team will review it shortly.' });
      await fetchReviews();
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, [user, toast, fetchReviews]);

  // Check if a specific booking has been reviewed
  const isBookingReviewed = useCallback(async (bookingId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .maybeSingle();
    return !!data;
  }, []);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [fetchReviews, checkCanReview]);

  return {
    reviews,
    stats,
    loading,
    canReview,
    sort,
    setSort,
    createReview,
    replyToReview,
    deleteReply,
    flagReview,
    isBookingReviewed,
    refetch: fetchReviews,
  };
};
