import { useState } from 'react';
import { Star, CheckCircle, Flag, MessageSquare, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<number, number>;
}

interface Review {
  id: string;
  rating: number;
  text: string | null;
  created_at: string;
  client_id: string;
  is_anonymous?: boolean | null;
  business_reply?: string | null;
  business_reply_at?: string | null;
  is_flagged?: boolean | null;
  service_name?: string | null;
  profiles?: {
    display_name: string | null;
    profile_photo_url: string | null;
  };
}

type SortOption = 'newest' | 'highest' | 'lowest';

interface ReviewsListProps {
  reviews: Review[];
  stats: ReviewStats | null;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isBusinessOwner?: boolean;
  onReply?: (reviewId: string, reply: string) => Promise<{ error: Error | null }>;
  onDeleteReply?: (reviewId: string) => Promise<{ error: Error | null }>;
  onFlag?: (reviewId: string, reason: string) => Promise<{ error: Error | null }>;
  className?: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={cn(
          'w-4 h-4',
          star <= rating ? 'fill-accent text-accent' : 'text-muted-foreground/30'
        )}
      />
    ))}
  </div>
);

const FLAG_REASONS = [
  'Spam or fake review',
  'Inappropriate or offensive content',
  'Not related to this business',
  'Conflict of interest',
  'Other',
];

const ReviewCard = ({
  review,
  isBusinessOwner,
  onReply,
  onDeleteReply,
  onFlag,
}: {
  review: Review;
  isBusinessOwner?: boolean;
  onReply?: (reviewId: string, reply: string) => Promise<{ error: Error | null }>;
  onDeleteReply?: (reviewId: string) => Promise<{ error: Error | null }>;
  onFlag?: (reviewId: string, reason: string) => Promise<{ error: Error | null }>;
}) => {
  const { user } = useAuth();
  const displayName = review.is_anonymous
    ? 'Anonymous'
    : review.profiles?.display_name || 'Client';

  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !onReply) return;
    setSubmittingReply(true);
    await onReply(review.id, replyText);
    setSubmittingReply(false);
    setShowReplyInput(false);
    setReplyText('');
  };

  const handleDeleteReply = async () => {
    if (!onDeleteReply) return;
    await onDeleteReply(review.id);
  };

  const handleFlag = async () => {
    if (!flagReason || !onFlag) return;
    await onFlag(review.id, flagReason);
    setShowFlagModal(false);
    setFlagReason('');
  };

  const canFlag = user && user.id !== review.client_id && !isBusinessOwner;

  return (
    <>
      <div className="p-4 bg-card rounded-xl border border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              {!review.is_anonymous && review.profiles?.profile_photo_url && (
                <AvatarImage src={review.profiles.profile_photo_url} alt={displayName} />
              )}
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(review.created_at), 'MMM d, yyyy')}
              </p>
              {review.service_name && (
                <p className="text-xs text-primary mt-0.5">Service: {review.service_name}</p>
              )}
            </div>
          </div>
          <StarRating rating={review.rating} />
        </div>

        {review.text && (
          <p className="text-sm text-muted-foreground mb-3">{review.text}</p>
        )}

        <div className="flex items-center gap-1 text-xs text-primary mb-3">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Verified Booking</span>
        </div>

        {/* Business Reply */}
        {review.business_reply && (
          <div className="bg-muted/50 border-l-3 border-primary rounded-r-lg p-3 mb-3" style={{ borderLeftWidth: '3px' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-primary">✂️ Business Response</span>
              {review.business_reply_at && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(review.business_reply_at), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            <p className="text-sm">{review.business_reply}</p>
            {isBusinessOwner && onDeleteReply && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive mt-1 h-6 px-2"
                onClick={handleDeleteReply}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete reply
              </Button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isBusinessOwner && !review.business_reply && onReply && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}

          {canFlag && onFlag && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground ml-auto h-7"
              onClick={() => setShowFlagModal(true)}
            >
              <Flag className="w-3 h-3 mr-1" />
              Report
            </Button>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a professional response to this review..."
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowReplyInput(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-gradient-primary"
                disabled={!replyText.trim() || submittingReply}
                onClick={handleSubmitReply}
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Flag Modal */}
      <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Review</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Why are you reporting this review?</p>
          <div className="space-y-2">
            {FLAG_REASONS.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left',
                  flagReason === reason && 'border-primary bg-primary/5 text-primary'
                )}
                onClick={() => setFlagReason(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagModal(false)}>
              Cancel
            </Button>
            <Button disabled={!flagReason} onClick={handleFlag} className="bg-gradient-primary">
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const ReviewsList = ({
  reviews,
  stats,
  sort,
  onSortChange,
  isBusinessOwner,
  onReply,
  onDeleteReply,
  onFlag,
  className,
}: ReviewsListProps) => {
  if (!stats || stats.reviewCount === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">No reviews yet</p>
        {!isBusinessOwner && (
          <p className="text-sm text-muted-foreground mt-1">Be the first to leave a review!</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Rating Summary */}
      <div className="flex gap-6 p-4 bg-muted/50 rounded-xl">
        <div className="text-center min-w-[100px]">
          <p className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(stats.averageRating)} />
          <p className="text-sm text-muted-foreground mt-1">
            {stats.reviewCount} {stats.reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.ratingDistribution[star] || 0;
            const percentage = stats.reviewCount > 0 ? (count / stats.reviewCount) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{star}</span>
                <Star className="w-3 h-3 fill-accent text-accent" />
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reviews</h3>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isBusinessOwner={isBusinessOwner}
            onReply={onReply}
            onDeleteReply={onDeleteReply}
            onFlag={onFlag}
          />
        ))}
      </div>
    </div>
  );
};
