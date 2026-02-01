import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit: (rating: number, text?: string) => Promise<{ error: Error | null }>;
  onCancel?: () => void;
}

export const ReviewForm = ({ onSubmit, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    const { error } = await onSubmit(rating, text);
    if (!error) {
      setRating(0);
      setText('');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-border">
      <h3 className="font-display text-lg font-semibold">How was your experience?</h3>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-1 focus:outline-none"
          >
            <Star
              className={cn(
                'w-8 h-8 transition-colors',
                (hoveredRating || rating) >= star
                  ? 'fill-accent text-accent'
                  : 'text-muted-foreground'
              )}
            />
          </motion.button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Great'}
            {rating === 5 && 'Excellent'}
          </span>
        )}
      </div>

      {/* Written Review */}
      <div className="space-y-2">
        <Textarea
          placeholder="Share details about your experience (optional)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {text.length}/500
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="flex-1 bg-gradient-primary hover:opacity-90"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </div>
    </div>
  );
};
