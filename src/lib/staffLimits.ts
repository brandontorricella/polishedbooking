import type { SubscriptionTier } from './subscriptionFeatures';

export const STAFF_LIMITS: Record<SubscriptionTier, number> = {
  starter: 1,
  basic: 2,
  pro: 5,
  elite: Infinity,
};

export function getStaffLimit(tier: SubscriptionTier | undefined | null): number {
  return STAFF_LIMITS[tier || 'basic'];
}

export function isAtStaffLimit(tier: SubscriptionTier | undefined | null, currentCount: number): boolean {
  return currentCount >= getStaffLimit(tier);
}

export function getStaffLimitLabel(tier: SubscriptionTier | undefined | null): string {
  const t = tier || 'basic';
  if (t === 'elite') return 'Unlimited staff members';
  if (t === 'pro') return 'Up to 5 staff members';
  if (t === 'starter') return '1 staff member';
  return 'Up to 2 staff members';
}
