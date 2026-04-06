import { ShieldCheck, ShieldAlert, Lock, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CancellationPolicyDisplayProps {
  business: any;
  className?: string;
}

export const CancellationPolicyDisplay = ({ business, className }: CancellationPolicyDisplayProps) => {
  const policy = business.cancellation_policy || business.cancellationPolicy || 'flexible';
  const depositRequired = business.deposit_required || business.depositRequired || false;
  const depositType = business.deposit_type || business.depositType || 'percentage';
  const depositAmount = business.deposit_amount || business.depositAmount || 25;
  const cancellationHours = business.cancellation_hours || business.cancellationHours || 24;

  if (policy === 'flexible' && !depositRequired) {
    return (
      <div className={cn("flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm", className)}>
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Free cancellation anytime</span>
      </div>
    );
  }

  const hours = cancellationHours;
  const timeLabel = hours >= 48 ? `${hours / 24} days` : `${hours} hours`;

  const policyLabel = policy === 'strict' ? 'Strict' : policy === 'moderate' ? 'Moderate' : 'Custom';
  const PolicyIcon = policy === 'strict' ? Lock : Scale;

  return (
    <div className={cn("p-4 rounded-xl bg-muted space-y-2", className)}>
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Cancellation Policy</span>
        <Badge variant="outline" className={cn(
          "text-xs",
          policy === 'strict' ? "border-destructive/50 text-destructive" : "border-amber-500/50 text-amber-600"
        )}>
          <PolicyIcon className="w-3 h-3 mr-1" />
          {policyLabel}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Free if canceled at least <strong>{timeLabel}</strong> before your appointment.
      </p>

      {depositRequired && (
        <p className="text-sm text-muted-foreground">
          A <strong>
            {depositType === 'percentage' ? `${depositAmount}% deposit` : `$${depositAmount} deposit`}
          </strong> is required to book.
        </p>
      )}
    </div>
  );
};
