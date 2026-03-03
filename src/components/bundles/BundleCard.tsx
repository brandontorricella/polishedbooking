import { motion } from 'framer-motion';
import { Clock, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ServiceBundle } from '@/hooks/useServiceBundles';

interface BundleCardProps {
  bundle: ServiceBundle;
  onBook: (bundle: ServiceBundle) => void;
}

export const BundleCard = ({ bundle, onBook }: BundleCardProps) => {
  const savingsPercent = bundle.original_total > 0
    ? Math.round((bundle.discount_amount / bundle.original_total) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-border bg-card hover:shadow-soft transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">{bundle.name}</h3>
        </div>
        {savingsPercent > 0 && (
          <Badge className="bg-primary text-primary-foreground border-0">
            <Tag className="w-3 h-3 mr-1" />
            Save {savingsPercent}%
          </Badge>
        )}
      </div>

      {bundle.description && (
        <p className="text-sm text-muted-foreground mb-4">{bundle.description}</p>
      )}

      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Includes:</p>
        {bundle.items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                {index + 1}
              </span>
              <span className="text-foreground">{item.service.name}</span>
            </div>
            <span className="text-muted-foreground">{item.service.duration} min</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {bundle.discount_amount > 0 && (
            <span className="text-sm text-muted-foreground line-through">${bundle.original_total.toFixed(2)}</span>
          )}
          <span className="text-2xl font-bold text-foreground">${bundle.final_total.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{bundle.total_duration} min</span>
        </div>
      </div>

      <Button
        className="w-full bg-gradient-primary hover:opacity-90"
        onClick={() => onBook(bundle)}
      >
        Book Bundle
      </Button>
    </motion.div>
  );
};
