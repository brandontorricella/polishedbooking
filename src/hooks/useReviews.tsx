import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Review = Tables<'reviews'>;

interface ReviewWithClient extends Review {
  profiles?: {
    display_name: string | null;
    profile_photo_url: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
}

export const useReviews = (businessId?: string) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewWithClient[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);

  // Fetch reviews for a business
  const fetchReviews = useCallback(async () => {
    if (!businessId) return;

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile data separately for each review
      const reviewsWithProfiles: ReviewWithClient[] = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, profile_photo_url')
            .eq('user_id', review.client_id)
            .maybeSingle();
          
          return {
            ...review,
            profiles: profileData || undefined,
          };
        })
      );
      
      setReviews(reviewsWithProfiles);

      // Calculate stats
      if (reviewsWithProfiles && reviewsWithProfiles.length > 0) {
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
  }, [businessId]);

  // Check if user can review (has completed booking)
  const checkCanReview = useCallback(async () => {
    if (!user || !businessId || profile?.role === 'business') {
      setCanReview(false);
      return;
    }

    try {
      // Check for completed bookings without existing review
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .limit(1);

      if (bookingError) throw bookingError;

      if (!bookings || bookings.length === 0) {
        setCanReview(false);
        return;
      }

      // Check for existing review
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle();

      setCanReview(!existingReview);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setCanReview(false);
    }
  }, [user, businessId, profile?.role]);

  // Create a review
  const createReview = useCallback(async (rating: number, text?: string) => {
    if (!user || !businessId) {
      return { error: new Error('Not authenticated') };
    }

    if (rating < 1 || rating > 5) {
      return { error: new Error('Rating must be between 1 and 5') };
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          client_id: user.id,
          business_id: businessId,
          rating,
          text: text?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your feedback!',
      });

      // Refresh reviews
      await fetchReviews();
      setCanReview(false);

      return { data, error: null };
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review. Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  }, [user, businessId, toast, fetchReviews]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [fetchReviews, checkCanReview]);

  return {
    reviews,
    stats,
    loading,
    canReview,
    createReview,
    refetch: fetchReviews,
  };
};
