// Subscription feature definitions and gating utilities

export type SubscriptionTier = 'starter' | 'basic' | 'pro' | 'elite';

export type FeatureKey =
  | 'public_profile'
  | 'local_search'
  | 'service_list'
  | 'in_app_booking'
  | 'reviews_ratings'
  | 'location_discovery'
  | 'virtual_sessions'
  | 'intake_forms'
  | 'appointment_types'
  | 'class_types'
  | 'credentials_display'
  | 'specialties_display'
  | 'community_identity_badges'
  | 'bnpl_payments'
  | 'tip_collection'
  | 'time_blocking'
  | 'schedule_management'
  | 'basic_analytics'
  | 'client_messaging'
  | 'cancellation_policy'
  | 'deposit_collection'
  | 'priority_search_placement'
  | 'recommended_badge'
  | 'expanded_photo_portfolio'
  | 'client_rebooking_prompts'
  | 'analytics_dashboard'
  | 'send_promotions'
  | 'group_class_booking'
  | 'service_packages'
  | 'membership_management'
  | 'embeddable_booking_widget'
  | 'staff_commission_tracking'
  | 'ai_weekly_insights'
  | 'last_minute_deals'
  | 'waitlist_management'
  | 'loyalty_program'
  | 'featured_placement_top'
  | 'top_of_map_positioning'
  | 'verified_badge'
  | 'homepage_collections'
  | 'city_collections'
  | 'priority_support'
  | 'early_access_features'
  | 'custom_reports'
  | 'benchmarking_analytics'
  | 'revenue_projections';

const STARTER_FEATURES: FeatureKey[] = [
  'public_profile',
  'local_search',
  'service_list',
  'in_app_booking',
  'reviews_ratings',
  'community_identity_badges',
  'basic_analytics',
  'client_messaging',
];

const BASIC_FEATURES: FeatureKey[] = [
  'public_profile',
  'local_search',
  'service_list',
  'in_app_booking',
  'reviews_ratings',
  'location_discovery',
  'virtual_sessions',
  'intake_forms',
  'appointment_types',
  'class_types',
  'credentials_display',
  'specialties_display',
  'community_identity_badges',
  'bnpl_payments',
  'tip_collection',
  'time_blocking',
  'schedule_management',
  'basic_analytics',
  'client_messaging',
  'cancellation_policy',
  'deposit_collection',
];

const PRO_EXTRAS: FeatureKey[] = [
  'priority_search_placement',
  'recommended_badge',
  'expanded_photo_portfolio',
  'client_rebooking_prompts',
  'analytics_dashboard',
  'send_promotions',
  'group_class_booking',
  'service_packages',
  'membership_management',
  'embeddable_booking_widget',
  'staff_commission_tracking',
  'ai_weekly_insights',
  'last_minute_deals',
  'waitlist_management',
  'loyalty_program',
];

const ELITE_EXTRAS: FeatureKey[] = [
  'featured_placement_top',
  'top_of_map_positioning',
  'verified_badge',
  'homepage_collections',
  'city_collections',
  'priority_support',
  'early_access_features',
  'custom_reports',
  'benchmarking_analytics',
  'revenue_projections',
];

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, { price: number; features: FeatureKey[] }> = {
  starter: {
    price: 0,
    features: [...STARTER_FEATURES],
  },
  basic: {
    price: 29,
    features: [...BASIC_FEATURES],
  },
  pro: {
    price: 59,
    features: [...BASIC_FEATURES, ...PRO_EXTRAS],
  },
  elite: {
    price: 99,
    features: [...BASIC_FEATURES, ...PRO_EXTRAS, ...ELITE_EXTRAS],
  },
};

export const GALLERY_LIMITS: Record<SubscriptionTier, number> = {
  starter: 3,
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
  virtual_sessions: 'Virtual Sessions',
  intake_forms: 'Intake Forms & Questionnaires',
  appointment_types: 'Appointment Types',
  class_types: 'Class Types',
  credentials_display: 'Credentials Display',
  specialties_display: 'Specialties Display',
  community_identity_badges: 'Community Identity Badges',
  bnpl_payments: 'Buy Now Pay Later Payments',
  tip_collection: 'Tip Collection',
  time_blocking: 'Time Blocking',
  schedule_management: 'Schedule Management',
  basic_analytics: 'Basic Analytics',
  client_messaging: 'Client Messaging',
  cancellation_policy: 'Cancellation Policy',
  deposit_collection: 'Deposit Collection',
  priority_search_placement: 'Priority Search Placement',
  recommended_badge: '"Recommended" Badge',
  expanded_photo_portfolio: 'Expanded Photo Portfolio',
  client_rebooking_prompts: 'Client Rebooking Prompts',
  analytics_dashboard: 'Analytics Dashboard',
  send_promotions: 'Send Promotions',
  group_class_booking: 'Group Class Booking',
  service_packages: 'Service Packages & Bundles',
  membership_management: 'Client Membership Management',
  embeddable_booking_widget: 'Embeddable Booking Widget',
  staff_commission_tracking: 'Staff Commission Tracking',
  ai_weekly_insights: 'AI Weekly Business Insights',
  last_minute_deals: 'Last Minute Deals',
  waitlist_management: 'Waitlist Management',
  loyalty_program: 'Loyalty Program',
  featured_placement_top: 'Featured Placement',
  top_of_map_positioning: 'Top-of-Map Positioning',
  verified_badge: '"Verified Elite" Badge',
  homepage_collections: 'Homepage Collections',
  city_collections: 'City Collections',
  priority_support: 'Priority Support',
  early_access_features: 'Early Access Features',
  custom_reports: 'Custom Report Builder',
  benchmarking_analytics: 'Industry Benchmarking',
  revenue_projections: 'Revenue Projections',
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
  const order: Record<SubscriptionTier, number> = { starter: -1, basic: 0, pro: 1, elite: 2 };
  return order[tier || 'basic'];
}
