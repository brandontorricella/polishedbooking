import { motion } from 'framer-motion';
import { Check, Star, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSubscription } from '@/hooks/useSuperwall';
import { useAuth } from '@/hooks/useAuth';

const pricingTiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Everything you need to get started',
    icon: Sparkles,
    features: [
      'Public business profile',
      'Appear in local & wellness search',
      'Appointments, classes & virtual sessions',
      'Reviews, ratings & credentials display',
      'BNPL payments & tip collection',
      'Deposits & cancellation policies',
      'Schedule & time blocking',
      'Client messaging & intake forms',
      'Community identity badges (free)',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'For growing beauty & wellness businesses',
    icon: Star,
    features: [
      'Everything in Basic',
      'Priority search placement',
      '"Recommended" badge',
      'Analytics dashboard + AI insights',
      'Service packages & memberships',
      'Embeddable booking widget',
      'Send promotions to past clients',
      'Staff commission tracking',
      'Last minute deals & loyalty program',
      'Expanded photo portfolio (20 photos)',
    ],
    recommended: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    description: 'Maximum visibility & features',
    icon: Crown,
    features: [
      'Everything in Pro',
      'Featured placement at top of search',
      'Top-of-map positioning',
      '"Verified Elite" badge',
      'Homepage & city collections',
      'Custom reports & benchmarking',
      'Revenue projections & forecasting',
      'Unlimited photo portfolio',
      'Priority support & early access',
    ],
    recommended: false,
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isSubscribed, subscription, startCheckout, manageSubscription } = useSubscription();

  const handleSelectTier = async (tierId: string) => {
    if (!user) {
      navigate('/auth?mode=signup&role=business');
      return;
    }

    if (profile?.role === 'client') {
      navigate('/auth?mode=signup&role=business');
      return;
    }

    if (profile?.role === 'business') {
      if (isSubscribed) {
        await manageSubscription();
      } else {
        await startCheckout(tierId as 'basic' | 'pro' | 'elite');
      }
      return;
    }

    navigate('/auth?mode=signup&role=business');
  };

  const getButtonText = (tierId: string) => {
    if (!user || profile?.role !== 'business') {
      return 'Start Free Trial';
    }
    if (subscription?.tier === tierId && isSubscribed) {
      return 'Current Plan';
    }
    if (isSubscribed) {
      return 'Switch Plan';
    }
    return 'Start Free Trial';
  };

  const isCurrentPlan = (tierId: string) => {
    return isSubscribed && subscription?.tier === tierId;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with a 30-day free trial. Cancel anytime from your browser.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isCurrent = isCurrentPlan(tier.id);
              
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl border ${
                    isCurrent
                      ? 'border-green-500 bg-green-500/5 shadow-elevated'
                      : tier.recommended
                        ? 'border-primary bg-card shadow-elevated'
                        : 'border-border bg-card'
                  } p-6 flex flex-col`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                      Your Plan
                    </Badge>
                  )}
                  {!isCurrent && tier.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCurrent ? 'bg-green-500/10' : tier.recommended ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isCurrent ? 'text-green-500' : tier.recommended ? 'text-primary' : 'text-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                      <p className="text-sm text-muted-foreground">{tier.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-4xl font-bold">${tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          isCurrent ? 'text-green-500' : tier.recommended ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSelectTier(tier.id)}
                    disabled={isCurrent}
                    className={`w-full ${
                      isCurrent
                        ? 'bg-green-500/20 text-green-700 cursor-default'
                        : tier.recommended
                          ? 'bg-gradient-primary hover:opacity-90'
                          : ''
                    }`}
                    variant={isCurrent ? 'secondary' : tier.recommended ? 'default' : 'outline'}
                  >
                    {getButtonText(tier.id)}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              Questions? Visit our{' '}
              <button
                onClick={() => navigate('/help')}
                className="text-primary hover:underline font-medium"
              >
                Help Center
              </button>
              {' '}or contact support.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default PricingPage;
