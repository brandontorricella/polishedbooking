// Subscription feature definitions and gating utilities

export type SubscriptionTier = 'basic' | 'pro' | 'elite';

export type FeatureKey =
  | 'public_profile'
  | 'local_search'
  | 'service_list'
  | 'in_app_booking'
  | 'reviews_ratings'
  | 'location_discovery'
  | 'priority_search_placement'
  | 'recommended_badge'
  | 'expanded_photo_portfolio'
  | 'client_rebooking_prompts'
  | 'analytics_dashboard'
  | 'send_promotions'
  | 'featured_placement_top'
  | 'top_of_map_positioning'
  | 'verified_badge'
  | 'homepage_collections'
  | 'city_collections'
  | 'priority_support'
  | 'early_access_features';

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, { price: number; features: FeatureKey[] }> = {
  basic: {
    price: 29,
    features: [
      'public_profile',
      'local_search',
      'service_list',
      'in_app_booking',
      'reviews_ratings',
      'location_discovery',
    ],
  },
  pro: {
    price: 59,
    features: [
      'public_profile',
      'local_search',
      'service_list',
      'in_app_booking',
      'reviews_ratings',
      'location_discovery',
      'priority_search_placement',
      'recommended_badge',
      'expanded_photo_portfolio',
      'client_rebooking_prompts',
      'analytics_dashboard',
      'send_promotions',
    ],
  },
  elite: {
    price: 99,
    features: [
      'public_profile',
      'local_search',
      'service_list',
      'in_app_booking',
      'reviews_ratings',
      'location_discovery',
      'priority_search_placement',
      'recommended_badge',
      'expanded_photo_portfolio',
      'client_rebooking_prompts',
      'analytics_dashboard',
      'send_promotions',
      'featured_placement_top',
      'top_of_map_positioning',
      'verified_badge',
      'homepage_collections',
      'city_collections',
      'priority_support',
      'early_access_features',
    ],
  },
};

export const GALLERY_LIMITS: Record<SubscriptionTier, number> = {
  basic: 5,
  pro: 20,
  elite: Infinity,
};

export const FEATURE_DISPLAY_NAMES: Record<FeatureKey, string> = {
  public_profile: 'Public Profile',
  local_search: 'Local Search',
  service_list: 'Service List',
  in_app_booking: 'In-App Booking',
  reviews_ratings: 'Reviews & Ratings',
  location_discovery: 'Location Discovery',
  priority_search_placement: 'Priority Search Placement',
  recommended_badge: '"Recommended" Badge',
  expanded_photo_portfolio: 'Expanded Photo Portfolio',
  client_rebooking_prompts: 'Client Rebooking Prompts',
  analytics_dashboard: 'Analytics Dashboard',
  send_promotions: 'Send Promotions',
  featured_placement_top: 'Featured Placement',
  top_of_map_positioning: 'Top-of-Map Positioning',
  verified_badge: '"Verified" Badge',
  homepage_collections: 'Homepage Collections',
  city_collections: 'City Collections',
  priority_support: 'Priority Support',
  early_access_features: 'Early Access Features',
};

export function hasFeature(tier: SubscriptionTier | undefined | null, feature: FeatureKey): boolean {
  const t = tier || 'basic';
  return SUBSCRIPTION_FEATURES[t]?.features.includes(feature) ?? false;
}

export function getRequiredTier(feature: FeatureKey): SubscriptionTier | null {
  if (SUBSCRIPTION_FEATURES.basic.features.includes(feature)) return 'basic';
  if (SUBSCRIPTION_FEATURES.pro.features.includes(feature)) return 'pro';
  if (SUBSCRIPTION_FEATURES.elite.features.includes(feature)) return 'elite';
  return null;
}

export function getGalleryLimit(tier: SubscriptionTier | undefined | null): number {
  return GALLERY_LIMITS[tier || 'basic'];
}

export function getTierOrder(tier: SubscriptionTier | undefined | null): number {
  const order: Record<SubscriptionTier, number> = { basic: 0, pro: 1, elite: 2 };
  return order[tier || 'basic'];
}
