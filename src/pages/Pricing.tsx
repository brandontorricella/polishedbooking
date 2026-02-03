import { motion } from 'framer-motion';
import { Check, Star, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';

const pricingTiers = [
  {
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
              Start with a 30-day free trial. No credit card required until trial ends.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-2xl border ${
                    tier.recommended
                      ? 'border-primary bg-card shadow-elevated'
                      : 'border-border bg-card'
                  } p-6 flex flex-col`}
                >
                  {tier.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      tier.recommended ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <Icon className={`w-6 h-6 ${tier.recommended ? 'text-primary' : 'text-foreground'}`} />
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
                          tier.recommended ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => navigate(`/business/onboarding?tier=${tier.name.toLowerCase()}`)}
                    className={`w-full ${
                      tier.recommended
                        ? 'bg-gradient-primary hover:opacity-90'
                        : ''
                    }`}
                    variant={tier.recommended ? 'default' : 'outline'}
                  >
                    Start Free Trial
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
