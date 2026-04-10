export type BillingInterval = 'monthly' | 'annual';
export type TierId = 'starter' | 'basic' | 'pro' | 'elite';

export interface TierPricing {
  name: string;
  icon: string;
  staffLimit: number;
  monthly: number;
  annualMonthly: number;
  annualTotal: number;
  annualSavings: number;
  bookingFeePct?: number;
}

export const PRICING: Record<TierId, TierPricing> = {
  starter: {
    name: 'Starter',
    icon: '🆓',
    staffLimit: 1,
    monthly: 0,
    annualMonthly: 0,
    annualTotal: 0,
    annualSavings: 0,
    bookingFeePct: 3,
  },
  basic: {
    name: 'Basic',
    icon: '✨',
    staffLimit: 2,
    monthly: 29,
    annualMonthly: 26.10,
    annualTotal: 313.20,
    annualSavings: 34.80,
  },
  pro: {
    name: 'Pro',
    icon: '⭐',
    staffLimit: 5,
    monthly: 59,
    annualMonthly: 53.10,
    annualTotal: 637.20,
    annualSavings: 70.80,
  },
  elite: {
    name: 'Elite',
    icon: '👑',
    staffLimit: Infinity,
    monthly: 99,
    annualMonthly: 89.10,
    annualTotal: 1069.20,
    annualSavings: 118.80,
  },
};

export const PAID_TIER_IDS: TierId[] = ['basic', 'pro', 'elite'];
export const ALL_TIER_IDS: TierId[] = ['starter', 'basic', 'pro', 'elite'];

export function getStaffLimitLabel(tier: TierId | undefined | null): string {
  const t = tier || 'basic';
  if (t === 'elite') return 'Unlimited staff members';
  if (t === 'pro') return 'Up to 5 staff members';
  if (t === 'starter') return '1 staff member';
  return 'Up to 2 staff members';
}

export function formatTierPrice(amount: number): string {
  return `$${amount.toFixed(2).replace('.00', '')}`;
}

export function getTierPrice(tier: TierId, interval: BillingInterval): number {
  const p = PRICING[tier];
  return interval === 'annual' ? p.annualMonthly : p.monthly;
}
