import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  Building2,
  Camera,
  MapPin,
  DollarSign,
  Check,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

const businessCategories = [
  'Hair Styling & Cuts',
  'Hair Coloring',
  'Makeup & Glam',
  'Nails & Manicures',
  'Eyelash Extensions',
  'Eyebrow Services',
  'Facials & Skincare',
  'Massage & Bodywork',
  'Barbering',
  'Bridal Beauty',
];

const subscriptionTiers = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    features: ['Business profile listing', 'Up to 10 services', 'Basic analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    features: ['Everything in Basic', 'Unlimited services', 'Priority search placement', 'Promotions & deals'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    features: ['Everything in Pro', 'Featured placement', 'Advanced analytics', 'Premium support'],
  },
];

const BusinessOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, session, updateProfile } = useAuth();
  const { toast } = useToast();
  const { createCheckout } = useSubscription();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Business info
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Location
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  
  // Subscription
  const [selectedTier, setSelectedTier] = useState('basic');

  const totalSteps = 5;

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=signup');
    }
  }, [user, navigate]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleCreateBusiness = async () => {
    if (!user) return;
    
    setIsLoading(true);

    // Calculate trial end date (30 days / 1 month from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const { data: business, error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: businessName,
      description: businessDescription,
      categories: selectedCategories,
      address,
      city,
      state,
      zip,
      subscription_tier: selectedTier as 'basic' | 'pro' | 'elite',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      is_published: true,
    }).select().single();

    if (error) {
      toast({
        title: 'Error creating business',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    setBusinessId(business.id);

    // Update user profile to business role
    await updateProfile({
      role: 'business',
      terms_accepted_at: new Date().toISOString(),
      privacy_accepted_at: new Date().toISOString(),
    });

    // Redirect to Stripe Checkout for payment setup
    try {
      await createCheckout(selectedTier as 'basic' | 'pro' | 'elite', business.id);
      
      toast({
        title: 'Business created!',
        description: 'Complete payment setup to activate your subscription.',
      });
    } catch (err) {
      // Even if Stripe fails, business is created with trial
      toast({
        title: 'Business created!',
        description: 'Your 30-day free trial has started. Add payment later in settings.',
      });
      navigate('/business/analytics');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Polished for Business</span>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-8 h-1.5 rounded-full transition-colors",
                i + 1 <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-primary" />
              </div>

              <h1 className="font-display text-3xl font-bold text-center mb-2">
                Tell us about your business
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                This information will appear on your public profile.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    className="h-12 mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    placeholder="Tell clients about your services..."
                    className="mt-1.5 min-h-[100px]"
                  />
                </div>

                <Button 
                  onClick={() => setStep(2)}
                  disabled={!businessName}
                  className="w-full h-14 bg-gradient-primary hover:opacity-90 rounded-xl mt-6"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Categories */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-lg w-full"
            >
              <h1 className="font-display text-3xl font-bold text-center mb-2">
                Select your categories
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Choose the services you offer (select all that apply).
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {businessCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                        isSelected 
                          ? "border-primary bg-primary text-primary-foreground" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                      {category}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)}
                  disabled={selectedCategories.length === 0}
                  className="flex-1 h-14 bg-gradient-primary hover:opacity-90 rounded-xl"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-8 h-8 text-primary" />
              </div>

              <h1 className="font-display text-3xl font-bold text-center mb-2">
                Where are you located?
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Help clients find you in their area.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    className="h-12 mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Los Angeles"
                      className="h-12 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="CA"
                      className="h-12 mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="90001"
                    className="h-12 mt-1.5"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep(2)}
                    className="flex-1 h-14 rounded-xl"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep(4)}
                    disabled={!city}
                    className="flex-1 h-14 bg-gradient-primary hover:opacity-90 rounded-xl"
                  >
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Subscription */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <DollarSign className="w-8 h-8 text-primary" />
              </div>

              <h1 className="font-display text-3xl font-bold text-center mb-2">
                Choose your plan
              </h1>
              <p className="text-muted-foreground text-center mb-8">
                Start with a 30-day free trial. Cancel anytime before it ends.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {subscriptionTiers.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all relative",
                      selectedTier === tier.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {tier.id === 'pro' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                        Popular
                      </span>
                    )}
                    <h3 className="font-display text-xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-3xl font-bold mb-4">
                      ${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(3)}
                  className="flex-1 h-14 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(5)}
                  className="flex-1 h-14 bg-gradient-primary hover:opacity-90 rounded-xl"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 5: Payment & Launch */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-8">
                <CreditCard className="w-10 h-10 text-primary-foreground" />
              </div>

              <h1 className="font-display text-3xl font-bold mb-4">
                Start Your Free Trial
              </h1>
              <p className="text-muted-foreground mb-4">
                You've selected the <strong className="text-foreground">{subscriptionTiers.find(t => t.id === selectedTier)?.name}</strong> plan 
                at <strong className="text-foreground">${subscriptionTiers.find(t => t.id === selectedTier)?.price}/month</strong>.
              </p>
              <p className="text-muted-foreground mb-8">
                Your 30-day free trial starts now. You won't be charged until the trial ends. 
                Cancel anytime before then to avoid billing.
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-8 text-left">
                <h4 className="font-medium mb-2">Trial Summary</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Full access to all {selectedTier === 'basic' ? 'Basic' : selectedTier === 'pro' ? 'Pro' : 'Elite'} features</li>
                  <li>✓ 14-day free trial</li>
                  <li>✓ Cancel anytime before trial ends</li>
                  <li>✓ Your business will be visible to clients immediately</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleCreateBusiness}
                  disabled={isLoading}
                  className="w-full h-14 bg-gradient-primary hover:opacity-90 text-lg rounded-xl"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-5 h-5" />
                      </motion.span>
                      Creating your business...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(4)}
                  className="w-full text-muted-foreground"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Go Back
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                By starting your trial, you agree to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusinessOnboarding;
