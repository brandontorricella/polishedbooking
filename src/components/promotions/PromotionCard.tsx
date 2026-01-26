import { motion } from 'framer-motion';
import { Tag, Clock, Percent, DollarSign, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Promotion } from '@/types';
import { cn } from '@/lib/utils';

interface PromotionCardProps {
  promotion: Promotion;
  businessName?: string;
  businessPhoto?: string;
  onClaim?: () => void;
  variant?: 'default' | 'compact';
}

export const PromotionCard = ({ 
  promotion, 
  businessName, 
  businessPhoto,
  onClaim,
  variant = 'default'
}: PromotionCardProps) => {
  const daysLeft = Math.ceil((new Date(promotion.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 7;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 bg-blush rounded-xl border border-primary/20"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
          {promotion.discountType === 'percentage' 
            ? <Percent className="w-5 h-5 text-primary-foreground" />
            : <DollarSign className="w-5 h-5 text-primary-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{promotion.title}</p>
          <p className="text-xs text-muted-foreground">
            {promotion.discountType === 'percentage' 
              ? `${promotion.discountValue}% off`
              : `$${promotion.discountValue} off`
            }
          </p>
        </div>
        {isExpiringSoon && (
          <Badge variant="destructive" className="text-xs">
            {daysLeft}d left
          </Badge>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-blush to-card">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 bg-gradient-primary text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  <span className="font-display text-lg font-semibold">{promotion.title}</span>
                </div>
                <p className="text-primary-foreground/80 text-sm mt-1">{promotion.description}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-display font-bold">
                  {promotion.discountType === 'percentage' 
                    ? `${promotion.discountValue}%`
                    : `$${promotion.discountValue}`
                  }
                </span>
                <p className="text-xs text-primary-foreground/70 uppercase tracking-wide">off</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {businessName && (
              <div className="flex items-center gap-3">
                {businessPhoto && (
                  <img 
                    src={businessPhoto} 
                    alt={businessName}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{businessName}</p>
                  <p className="text-xs text-muted-foreground">Valid at this location</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={cn(isExpiringSoon && "text-destructive font-medium")}>
                  {daysLeft > 0 ? `${daysLeft} days left` : 'Expires today!'}
                </span>
              </div>
              {promotion.isNewClientOnly && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>New clients only</span>
                </div>
              )}
            </div>

            {promotion.code && (
              <div className="p-3 bg-muted rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Use code</p>
                <p className="font-mono font-bold text-lg tracking-wider">{promotion.code}</p>
              </div>
            )}

            <Button 
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={onClaim}
            >
              Claim Offer
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
