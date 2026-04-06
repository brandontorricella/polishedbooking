import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSuperwall';
import { 
  TrendingUp, Users, Calendar, Star, Check, ArrowRight, Crown, Sparkles,
  BarChart3, MessageSquare, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const pricingTiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    description: 'Perfect for getting started',
    features: [
      'Business profile listing',
      'Up to 10 services',
      'Basic booking management',
      'Customer reviews',
      'Standard support',
    ],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'For growing businesses',
    features: [
      'Everything in Basic',
      'Unlimited services',
      'Priority in search results',
      'Analytics dashboard',
      'In-app messaging',
      'Promotions & deals',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    description: 'For top professionals',
    features: [
      'Everything in Pro',
      'Featured badge',
      'Top placement in search',
      'AI-powered recommendations',
      'Advanced analytics',
      'Custom branding',
      'Dedicated support',
    ],
    popular: false,
  },
];

const BusinessPage = () => {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading, startCheckout, subscription } = useSubscription();

  const isBusinessUser = profile?.role === 'business';
  const isLoading = authLoading || subLoading;

  // If business user is logged in and subscribed, redirect to analytics
  useEffect(() => {
    if (!isLoading && isBusinessUser && isSubscribed) {
      navigate('/business/analytics');
    }
  }, [isLoading, isBusinessUser, isSubscribed, navigate]);

  const handleStartTrial = (tierId?: string) => {
    if (user && isBusinessUser) {
      startCheckout((tierId as 'basic' | 'pro' | 'elite') || 'basic');
    } else if (user) {
      navigate('/business/onboarding');
    } else {
      navigate('/auth?mode=signup&redirect=/business/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge className="mb-6 bg-accent text-accent-foreground px-4 py-1.5">
              <Crown className="w-4 h-4 mr-2" />
              For Beauty Professionals
            </Badge>
            
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Grow Your <span className="text-gradient">Beauty Business</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of beauty professionals using Polished to reach new clients, 
              manage bookings, and grow their revenue. Access from any device, anywhere.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl"
                onClick={() => handleStartTrial()}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              30-day free trial • Cancel anytime • Access from any browser
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for beauty and wellness professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Reach New Clients', description: 'Get discovered by thousands of clients searching for services in your area.' },
              { icon: Calendar, title: 'Easy Booking Management', description: 'Accept bookings 24/7 and manage your schedule with our intuitive calendar.' },
              { icon: BarChart3, title: 'Business Analytics', description: 'Track your performance with detailed insights on bookings, revenue, and growth.' },
              { icon: MessageSquare, title: 'In-App Messaging', description: 'Communicate directly with clients to build relationships and loyalty.' },
              { icon: Zap, title: 'AI Recommendations', description: 'Get matched with ideal clients through our smart recommendation engine.' },
              { icon: Star, title: 'Reviews & Reputation', description: 'Build trust with verified reviews and showcase your best work.' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="h-full border-border hover:shadow-soft transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that works best for your business
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={tier.popular ? 'md:-mt-4 md:mb-4' : ''}
              >
                <Card className={`h-full relative ${tier.popular ? 'border-primary shadow-glow' : 'border-border'}`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="font-display text-2xl font-bold">{tier.name}</h3>
                    <p className="text-muted-foreground mb-6">{tier.description}</p>
                    
                    <div className="mb-6">
                      <span className="text-4xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${tier.popular ? 'bg-gradient-primary' : ''}`}
                      variant={tier.popular ? 'default' : 'outline'}
                      onClick={() => handleStartTrial(tier.id)}
                    >
                      Start Free Trial
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-midnight text-cream">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-accent" />
            <h2 className="font-display text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto mb-8">
              Join Polished today and start growing your beauty business. 
              Access your dashboard from any device, anywhere.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl"
              onClick={() => handleStartTrial()}
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BusinessPage;
