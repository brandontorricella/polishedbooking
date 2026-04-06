import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tag, Clock, Percent, DollarSign, Users, Copy, Check, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { BookNowButton } from '@/components/booking/BookNowButton';

interface PromotionCardProps {
  promotion: {
    id: string;
    business_id: string;
    title: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    code: string | null;
    is_new_client_only: boolean | null;
    end_date: string;
    total_claimed: number | null;
    max_claims: number | null;
    business: {
      id: string;
      name: string;
      profile_photo_url: string | null;
      city: string | null;
      state: string | null;
    } | null;
  };
  isClaimed?: boolean;
  onClaim?: (promotionId: string, businessId: string) => Promise<{ success: boolean; error?: string }>;
  variant?: 'default' | 'compact';
}

export const PromotionCard = ({ 
  promotion, 
  isClaimed = false,
  onClaim,
  variant = 'default'
}: PromotionCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(isClaimed);
  const [errorMsg, setErrorMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const daysLeft = Math.ceil((new Date(promotion.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 7;

  const handleClaim = async () => {
    setErrorMsg('');
    if (!user) {
      navigate('/auth?mode=signup');
      return;
    }
    if (!onClaim) return;

    setClaiming(true);
    const result = await onClaim(promotion.id, promotion.business_id);
    setClaiming(false);

    if (result.success) {
      setClaimed(true);
      setShowModal(true);
    } else {
      setErrorMsg(result.error || 'Failed to claim');
    }
  };

  const handleCopyCode = () => {
    if (promotion.code) {
      navigator.clipboard.writeText(promotion.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
          {promotion.discount_type === 'percentage' 
            ? <Percent className="w-5 h-5 text-primary-foreground" />
            : <DollarSign className="w-5 h-5 text-primary-foreground" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-foreground">{promotion.title}</p>
          <p className="text-xs text-muted-foreground">
            {promotion.discount_type === 'percentage' 
              ? `${promotion.discount_value}% off`
              : `$${promotion.discount_value} off`
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
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-card">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    <span className="font-display text-lg font-semibold">{promotion.title}</span>
                  </div>
                  {promotion.description && (
                    <p className="text-primary-foreground/80 text-sm mt-1">{promotion.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-3xl font-display font-bold">
                    {promotion.discount_type === 'percentage' 
                      ? `${promotion.discount_value}%`
                      : `$${promotion.discount_value}`
                    }
                  </span>
                  <p className="text-xs text-primary-foreground/70 uppercase tracking-wide">off</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {promotion.business && (
                <div className="flex items-center gap-3">
                  {promotion.business.profile_photo_url ? (
                    <img 
                      src={promotion.business.profile_photo_url} 
                      alt={promotion.business.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {promotion.business.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{promotion.business.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {promotion.business.city}, {promotion.business.state}
                    </p>
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
                {promotion.is_new_client_only && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>New clients only</span>
                  </div>
                )}
              </div>

              {promotion.code && (
                <div className="p-3 bg-muted rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Use code</p>
                  <p className="font-mono font-bold text-lg tracking-wider text-foreground">{promotion.code}</p>
                </div>
              )}

              {claimed ? (
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-600 text-white cursor-default"
                  disabled
                >
                  ✅ Offer Claimed!
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-primary-foreground"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    'Claim Offer'
                  )}
                </Button>
              )}

              {errorMsg && (
                <p className="text-destructive text-sm text-center">{errorMsg}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Success Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="text-5xl block mb-4">🎉</span>
              Offer Claimed!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              Show this screen when you arrive
            </p>

            <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-4">
              {promotion.business && (
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  {promotion.business.profile_photo_url ? (
                    <img src={promotion.business.profile_photo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-primary-foreground font-bold">{promotion.business.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{promotion.business.name}</p>
                    <p className="text-sm text-muted-foreground">{promotion.business.city}, {promotion.business.state}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-lg text-foreground">{promotion.title}</p>
                {promotion.description && (
                  <p className="text-sm text-muted-foreground mt-1">{promotion.description}</p>
                )}
              </div>

              <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0 text-lg px-4 py-1">
                {promotion.discount_type === 'percentage'
                  ? `${promotion.discount_value}% OFF`
                  : `$${promotion.discount_value} OFF`
                }
              </Badge>

              {promotion.code && (
                <div className="flex items-center gap-3 p-3 bg-foreground/5 dark:bg-background rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Your Promo Code</p>
                    <p className="font-mono font-bold text-xl tracking-wider text-primary">{promotion.code}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleCopyCode}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                ⏰ Expires {new Date(promotion.end_date).toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric'
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <BookNowButton
                businessId={promotion.business_id}
                label="Book Now →"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  navigate(`/business/${promotion.business_id}`);
                }}
              >
                View Business
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
