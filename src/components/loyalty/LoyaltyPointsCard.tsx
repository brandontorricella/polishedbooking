import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Gift, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LoyaltyPointsCardProps {
  businessId: string;
  businessName?: string;
}

export const LoyaltyPointsCard = ({ businessId, businessName }: LoyaltyPointsCardProps) => {
  const { user } = useAuth();
  const { program, balance, redeemableValue, canRedeem, transactions, isLoading, redeemPoints } = useLoyalty(businessId);
  const [showRedeem, setShowRedeem] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);

  if (!user || isLoading || !program) return null;

  const discountPreview = pointsToRedeem * program.redemption_rate;

  const handleRedeem = async () => {
    setIsRedeeming(true);
    const result = await redeemPoints(pointsToRedeem);
    setIsRedeeming(false);
    if (result) {
      setShowRedeem(false);
      setPointsToRedeem(0);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-br from-foreground to-foreground/80 text-background border-0 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-lg">Your Rewards</h3>
            </div>

            <div className="text-center my-4">
              <span className="text-5xl font-bold">{balance}</span>
              <span className="block text-sm text-background/60 mt-1">points</span>
            </div>

            <p className="text-center text-primary text-sm font-medium mb-4">
              Worth ${redeemableValue.toFixed(2)} in discounts
            </p>

            {canRedeem ? (
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  setPointsToRedeem(program.min_redemption_points);
                  setShowRedeem(true);
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                Redeem Points
              </Button>
            ) : (
              <p className="text-center text-sm text-background/50">
                {program.min_redemption_points - balance} more points to redeem
              </p>
            )}

            <p className="text-center text-xs text-background/40 mt-3">
              Earn {program.points_per_dollar} point per $1 spent
            </p>

            {transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-background/10 space-y-2">
                <p className="text-xs font-medium text-background/60">Recent Activity</p>
                {transactions.slice(0, 3).map(tx => (
                  <div key={tx.id} className="flex justify-between text-xs">
                    <span className="text-background/70 truncate mr-2">{tx.description}</span>
                    <span className={tx.points > 0 ? 'text-green-400' : 'text-primary'}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Redeem Dialog */}
      <Dialog open={showRedeem} onOpenChange={setShowRedeem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem Points</DialogTitle>
          </DialogHeader>

          <div className="text-center mb-6">
            <span className="text-4xl font-bold">{balance}</span>
            <span className="block text-sm text-muted-foreground">points available</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Points to redeem</label>
              <Slider
                value={[pointsToRedeem]}
                onValueChange={([v]) => setPointsToRedeem(v)}
                min={program.min_redemption_points}
                max={balance}
                step={10}
                className="mt-3"
              />
              <div className="flex justify-between mt-2 text-sm">
                <span>{pointsToRedeem} points</span>
                <span className="font-semibold text-primary">${discountPreview.toFixed(2)} off</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              After redemption: {balance - pointsToRedeem} points remaining
            </p>

            <Button
              className="w-full bg-gradient-primary"
              onClick={handleRedeem}
              disabled={isRedeeming || pointsToRedeem < program.min_redemption_points}
            >
              {isRedeeming ? 'Redeeming...' : `Redeem for $${discountPreview.toFixed(2)} Off`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
