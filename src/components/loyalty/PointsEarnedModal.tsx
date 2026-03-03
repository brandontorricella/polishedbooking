import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface PointsEarnedModalProps {
  isOpen: boolean;
  onClose: () => void;
  points: number;
  businessName?: string;
}

export const PointsEarnedModal = ({ isOpen, onClose, points, businessName }: PointsEarnedModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="py-4"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-bold mb-2">You earned points!</h2>

          <div className="flex items-center justify-center gap-2 my-6">
            <Star className="w-6 h-6 text-accent fill-accent" />
            <span className="text-4xl font-bold text-primary">+{points}</span>
            <span className="text-muted-foreground">points</span>
          </div>

          {businessName && (
            <p className="text-sm text-muted-foreground mb-6">
              From your visit to {businessName}
            </p>
          )}

          <Button className="w-full bg-gradient-primary" onClick={onClose}>
            Awesome!
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
