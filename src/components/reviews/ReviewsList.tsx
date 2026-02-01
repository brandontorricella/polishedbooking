import { Star, CheckCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  is_anonymous?: boolean | null;
  profiles?: {
    display_name: string | null;
    profile_photo_url: string | null;
  };
}

interface ReviewsListProps {
  reviews: Review[];
  stats: ReviewStats | null;
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

const ReviewCard = ({ review }: { review: Review }) => {
  const displayName = review.is_anonymous 
    ? 'Anonymous' 
    : review.profiles?.display_name || 'Client';

  return (
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
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {review.text && (
        <p className="text-sm text-muted-foreground mb-3">{review.text}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-primary">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Verified Booking</span>
      </div>
    </div>
  );
};

export const ReviewsList = ({ reviews, stats, className }: ReviewsListProps) => {
  if (!stats || stats.reviewCount === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Rating Summary */}
      <div className="flex gap-6 p-4 bg-muted/50 rounded-xl">
        <div className="text-center">
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

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
