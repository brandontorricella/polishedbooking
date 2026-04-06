import { motion } from 'framer-motion';
import { ArrowRight, Check, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface PlanInfo {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface ConfirmPlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  newTier: string;
  plans: PlanInfo[];
  onConfirm: () => void;
  isProcessing: boolean;
}

export const ConfirmPlanChangeModal = ({
  open,
  onOpenChange,
  currentTier,
  newTier,
  plans,
  onConfirm,
  isProcessing,
}: ConfirmPlanChangeModalProps) => {
  const currentPlan = plans.find(p => p.id === currentTier);
  const newPlan = plans.find(p => p.id === newTier);
  if (!currentPlan || !newPlan) return null;

  const tierOrder: Record<string, number> = { basic: 1, pro: 2, elite: 3 };
  const isUpgrade = tierOrder[newTier] > tierOrder[currentTier];
  const priceDiff = newPlan.price - currentPlan.price;

  // Features that will be lost on downgrade
  const lostFeatures = currentPlan.features.filter(
    f => !newPlan.features.includes(f) && !f.includes('Everything in')
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-center">
            {isUpgrade ? 'Upgrade' : 'Downgrade'} to {newPlan.name}?
          </AlertDialogTitle>
        </AlertDialogHeader>

        {/* Plan comparison */}
        <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-xl">
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">Current</span>
            <span className="font-semibold block">{currentPlan.name}</span>
            <span className="text-sm text-muted-foreground">${currentPlan.price}/mo</span>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">New</span>
            <span className="font-semibold block">{newPlan.name}</span>
            <span className="text-sm text-muted-foreground">${newPlan.price}/mo</span>
          </div>
        </div>

        <AlertDialogDescription asChild>
          <div className="space-y-3">
            {isUpgrade ? (
              <>
                <p className="text-sm text-muted-foreground">
                  You'll be charged a prorated amount of ${Math.abs(priceDiff)} for
                  the remainder of this billing period, then ${newPlan.price}/month going forward.
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <Check className="w-4 h-4" /> New features available immediately
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Your plan will change to {newPlan.name} immediately.
                  Your new rate will be ${newPlan.price}/month.
                </p>
                {lostFeatures.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> You will lose access to:
                    </p>
                    <ul className="bg-amber-50 dark:bg-amber-500/10 rounded-lg p-3 space-y-1">
                      {lostFeatures.map((f, i) => (
                        <li key={i} className="text-sm flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-destructive" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
          </div>
        </AlertDialogDescription>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isProcessing}
            className={cn(
              isUpgrade
                ? "bg-primary hover:bg-primary/90"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {isProcessing ? 'Processing...' : isUpgrade ? `Upgrade to ${newPlan.name}` : `Downgrade to ${newPlan.name}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
