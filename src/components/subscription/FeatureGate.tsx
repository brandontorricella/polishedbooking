import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import {
  type FeatureKey,
  getRequiredTier,
  FEATURE_DISPLAY_NAMES,
  SUBSCRIPTION_FEATURES,
} from '@/lib/subscriptionFeatures';
import { motion } from 'framer-motion';

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasFeature } = useFeatureAccess();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return <UpgradePrompt feature={feature} />;
}

function UpgradePrompt({ feature }: { feature: FeatureKey }) {
  const navigate = useNavigate();
  const { tier } = useFeatureAccess();
  const requiredTier = getRequiredTier(feature);
  if (!requiredTier) return null;

  const tierNames = { basic: 'Basic', pro: 'Pro', elite: 'Elite' } as const;
  const price = SUBSCRIPTION_FEATURES[requiredTier].price;
  const featureName = FEATURE_DISPLAY_NAMES[feature] || 'This Feature';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto text-center py-12 px-6"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2">
        {featureName} is a {tierNames[requiredTier]} Feature
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        Upgrade to {tierNames[requiredTier]} to unlock this feature and grow your business.
      </p>
      <div className="flex flex-col gap-3">
        <Button
          onClick={() => navigate(`/business/pricing?upgrade=${requiredTier}`)}
          className="bg-gradient-primary text-primary-foreground"
        >
          Upgrade to {tierNames[requiredTier]} – ${price}/mo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/business/pricing')}
        >
          Compare Plans
        </Button>
      </div>
    </motion.div>
  );
}

// Full-page locked feature component
interface LockedFeaturePageProps {
  icon: ReactNode;
  title: string;
  description: string;
  requiredTier: 'pro' | 'elite';
  benefits: string[];
}

export function LockedFeaturePage({ icon, title, description, requiredTier, benefits }: LockedFeaturePageProps) {
  const navigate = useNavigate();
  const tierNames = { pro: 'Pro', elite: 'Elite' } as const;
  const prices = { pro: 59, elite: 99 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center py-8 px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h2 className="font-display text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-4">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-muted px-3 py-1.5 rounded-full mb-6">
        <Lock className="w-3.5 h-3.5" /> {tierNames[requiredTier]} Feature
      </span>

      <div className="bg-card border border-border rounded-2xl p-5 text-left mb-6">
        <h4 className="font-semibold mb-3">What you'll get:</h4>
        <ul className="space-y-2">
          {benefits.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => navigate(`/business/pricing?upgrade=${requiredTier}`)}
          className="bg-gradient-primary text-primary-foreground"
          size="lg"
        >
          Upgrade to {tierNames[requiredTier]} – ${prices[requiredTier]}/mo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button variant="outline" onClick={() => navigate('/business/pricing')}>
          Compare All Plans
        </Button>
      </div>
    </motion.div>
  );
}
