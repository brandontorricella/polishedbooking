import { useSubscription } from '@/hooks/useSuperwall';
import {
  hasFeature,
  getGalleryLimit,
  type FeatureKey,
  type SubscriptionTier,
} from '@/lib/subscriptionFeatures';

export function useFeatureAccess() {
  const { subscription } = useSubscription();
  const tier: SubscriptionTier = subscription?.tier || 'basic';

  return {
    tier,
    isBasic: tier === 'basic',
    isPro: tier === 'pro',
    isElite: tier === 'elite',

    hasFeature: (feature: FeatureKey) => hasFeature(tier, feature),

    // Convenience booleans
    canAccessAnalytics: hasFeature(tier, 'analytics_dashboard'),
    canSendPromotions: hasFeature(tier, 'send_promotions'),
    canAccessRebookingPrompts: hasFeature(tier, 'client_rebooking_prompts'),
    canExpandPhotoPortfolio: hasFeature(tier, 'expanded_photo_portfolio'),
    hasPriorityPlacement: hasFeature(tier, 'priority_search_placement'),
    hasFeaturedPlacement: hasFeature(tier, 'featured_placement_top'),
    hasVerifiedBadge: hasFeature(tier, 'verified_badge'),
    hasRecommendedBadge: tier === 'pro',
    galleryLimit: getGalleryLimit(tier),
  };
}
