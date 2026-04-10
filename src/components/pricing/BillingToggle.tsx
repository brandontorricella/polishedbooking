import type { BillingInterval } from '@/constants/pricing';

interface BillingToggleProps {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
}

export const BillingToggle = ({ interval, onChange }: BillingToggleProps) => {
  return (
    <div className="flex flex-col items-center gap-2 my-6">
      <div className="flex bg-secondary border border-border rounded-xl p-1 gap-1">
        <button
          onClick={() => onChange('monthly')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer ${
            interval === 'monthly'
              ? 'bg-card text-foreground shadow-sm'
              : 'bg-transparent text-muted-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => onChange('annual')}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all border-none cursor-pointer flex items-center gap-2 ${
            interval === 'annual'
              ? 'bg-card text-foreground shadow-sm'
              : 'bg-transparent text-muted-foreground'
          }`}
        >
          Annual
          <span className="px-2 py-0.5 bg-green-500/15 border border-green-500/30 rounded-full text-[11px] font-bold text-green-500">
            Save 10%
          </span>
        </button>
      </div>
      {interval === 'annual' && (
        <p className="text-xs text-muted-foreground m-0">
          Billed once per year · 10% off vs monthly
        </p>
      )}
    </div>
  );
};
