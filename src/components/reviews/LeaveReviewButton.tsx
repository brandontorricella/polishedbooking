import { useState, useEffect } from 'react';
import { Star, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { BookingWithDetails } from '@/hooks/useBookings';

interface LeaveReviewButtonProps {
  booking: BookingWithDetails;
}

export const LeaveReviewButton = ({ booking }: LeaveReviewButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviewed, setReviewed] = useState(false);
  const [existingRating, setExistingRating] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (booking.status !== 'completed' || !user) {
      setChecking(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, rating')
        .eq('booking_id', booking.id)
        .maybeSingle();

      if (data) {
        setReviewed(true);
        setExistingRating(data.rating);
      }
      setChecking(false);
    };
    check();
  }, [booking.id, booking.status, user]);

  if (booking.status !== 'completed' || checking || !user) return null;

  if (reviewed) {
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Reviewed {'⭐'.repeat(existingRating)}
      </Badge>
    );
  }

  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('reviews').insert({
        client_id: user.id,
        business_id: booking.business_id,
        booking_id: booking.id,
        rating,
        text: comment.trim() || null,
      });

      if (error) throw error;

      toast({ title: 'Review Submitted', description: 'Thank you for your feedback!' });
      setReviewed(true);
      setExistingRating(rating);
      setShowModal(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        className="bg-gradient-primary hover:opacity-90"
        onClick={() => setShowModal(true)}
      >
        <Star className="w-4 h-4 mr-1" />
        Leave a Review
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>

          {/* Business Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <img
              src={booking.business?.profile_photo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100'}
              alt=""
              className="w-12 h-12 rounded-lg object-cover"
            />
            <div>
              <p className="font-semibold">{booking.business?.name}</p>
              <p className="text-sm text-muted-foreground">
                {booking.service?.name} · {new Date(booking.booking_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center space-y-2">
            <p className="font-medium">How would you rate your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={cn(
                      'w-10 h-10 transition-colors',
                      (hoveredRating || rating) >= star
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground/30'
                    )}
                  />
                </motion.button>
              ))}
            </div>
            {(hoveredRating || rating) > 0 && (
              <p className="text-sm font-semibold text-accent">
                {ratingLabels[hoveredRating || rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share your experience (optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience — what did you love?"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitting}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
