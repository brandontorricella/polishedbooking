import { motion } from 'framer-motion';
import { Check, Star, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSuperwall } from '@/hooks/useSuperwall';
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
      'Appear in local search results',
      'Service list with pricing',
      'Booking link or in-app booking',
      'Reviews & ratings',
      'Location-based discovery',
    ],
    recommended: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'For growing businesses',
    icon: Star,
    features: [
      'Everything in Basic',
      'Priority placement in search',
      '"Recommended" badge',
      'Expanded photo portfolio',
      'Client rebooking prompts',
      'Analytics dashboard',
      'Send promotions to past clients',
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
      'Featured placement at top',
      'Top-of-map positioning',
      '"Verified" badge',
      'Homepage & city collections',
      'Priority support',
      'Early access to new features',
    ],
    recommended: false,
  },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { showPaywall, isSubscribed, subscription } = useSuperwall();

  const handleSelectTier = async (tierId: string) => {
    // If user is not logged in, redirect to signup
    if (!user) {
      navigate(`/business/onboarding?tier=${tierId}`);
      return;
    }

    // If user is a client, redirect to business onboarding
    if (profile?.role === 'client') {
      navigate(`/business/onboarding?tier=${tierId}`);
      return;
    }

    // If user is already a business, show paywall for upgrade/change
    if (profile?.role === 'business') {
      const purchased = await showPaywall(tierId as 'basic' | 'pro' | 'elite');
      if (purchased) {
        navigate('/business/analytics?success=true');
      }
      return;
    }

    // Default: go to onboarding
    navigate(`/business/onboarding?tier=${tierId}`);
  };

  const getButtonText = (tierId: string) => {
    if (!user || profile?.role !== 'business') {
      return 'Start Free Trial';
    }
    if (subscription?.tier === tierId) {
      return 'Current Plan';
    }
    return 'Switch Plan';
  };

  const isCurrentPlan = (tierId: string) => {
    return isSubscribed && subscription?.tier === tierId;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start with a 30-day free trial. Payment info required to start trial.
            </p>
          </motion.div>

          {/* Pricing Cards */}
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
                      isCurrent 
                        ? 'bg-green-500/10'
                        : tier.recommended 
                          ? 'bg-primary/10' 
                          : 'bg-secondary'
                    }`}>
                      <Icon className={`w-6 h-6 ${
                        isCurrent 
                          ? 'text-green-500' 
                          : tier.recommended 
                            ? 'text-primary' 
                            : 'text-foreground'
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
                          isCurrent
                            ? 'text-green-500'
                            : tier.recommended 
                              ? 'text-primary' 
                              : 'text-muted-foreground'
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

          {/* FAQ Link */}
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
