import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Sparkles, Building2, MapPin, Check, Crown, Star, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSuperwall } from '@/hooks/useSuperwall';

const subscriptionTiers = [
  {
    id: 'basic', name: 'Basic', price: 29, icon: '✨',
    tagline: 'Perfect for getting started',
    features: ['Public business profile', 'Appear in local search', 'Service list with pricing', 'In-app booking', 'Reviews & ratings', 'Location discovery'],
  },
  {
    id: 'pro', name: 'Pro', price: 59, icon: '⭐',
    tagline: 'Most popular for growing businesses', popular: true,
    features: ['Everything in Basic', 'Priority search placement', '"Recommended" badge', 'Analytics dashboard', 'Send promotions to clients', 'Client rebooking prompts', 'Expanded photo portfolio'],
  },
  {
    id: 'elite', name: 'Elite', price: 99, icon: '👑',
    tagline: 'Maximum visibility & features',
    features: ['Everything in Pro', 'Featured placement at top', '"Verified Elite" badge', 'Homepage collections', 'Top-of-map positioning', 'Priority support', 'Early access to features'],
  },
];

const businessCategories = [
  '💇 Hair Salon', '💅 Nail Studio', '🧖 Spa', '💋 Makeup Artist',
  '🧘 Massage Therapy', '👁 Lash Studio', '🪮 Brow Studio', '💈 Barbershop',
  '💉 PMU Artist', '🛁 Waxing Studio', '🦷 Teeth Whitening', '💆 Wellness',
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type HoursMap = Record<number, { is_open: boolean; open: string; close: string }>;

const defaultHours: HoursMap = {
  0: { is_open: false, open: '09:00', close: '18:00' },
  1: { is_open: true, open: '09:00', close: '18:00' },
  2: { is_open: true, open: '09:00', close: '18:00' },
  3: { is_open: true, open: '09:00', close: '18:00' },
  4: { is_open: true, open: '09:00', close: '18:00' },
  5: { is_open: true, open: '09:00', close: '17:00' },
  6: { is_open: false, open: '09:00', close: '15:00' },
};

const BusinessOnboarding = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { showPaywall, refreshSubscription } = useSuperwall();

  // Phase: 'tier' -> 'info' (steps 1-6)
  const [phase, setPhase] = useState<'tier' | 'info'>('tier');
  const [selectedTier, setSelectedTier] = useState('pro');
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);

  // Business data
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [hours, setHours] = useState<HoursMap>(defaultHours);
  const [identity, setIdentity] = useState({
    is_black_owned: false,
    is_hispanic_owned: false,
    is_lgbtq_owned: false,
    is_lgbtq_welcoming: false,
  });

  const totalSteps = 6;

  useEffect(() => {
    if (!user) navigate('/auth?mode=signup');
  }, [user, navigate]);

  useEffect(() => {
    const checkTrial = async () => {
      if (!profile?.email) return;
      const { data } = await supabase.rpc('has_used_trial', { check_email: profile.email });
      setHasUsedTrial(data === true);
    };
    checkTrial();
  }, [profile?.email]);

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const updateHour = (day: number, field: string, value: any) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const handleCreateBusiness = async () => {
    if (!user || !profile) return;
    setIsLoading(true);

    const isEligibleForTrial = !hasUsedTrial;
    const trialEndsAt = isEligibleForTrial ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const hoursJson: Record<string, any> = {};
    Object.entries(hours).forEach(([day, h]) => {
      hoursJson[day] = { is_open: h.is_open, open: h.open, close: h.close };
    });

    const { data: business, error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name: businessName,
      description,
      phone,
      address,
      city,
      state,
      zip,
      categories: categories,
      hours: hoursJson,
      subscription_tier: selectedTier as 'basic' | 'pro' | 'elite',
      subscription_status: 'trialing' as const,
      trial_ends_at: trialEndsAt?.toISOString() || null,
      is_published: false,
      is_publicly_visible: true,
      onboarding_completed: true,
      ...identity,
    }).select().single();

    if (error) {
      toast({ title: 'Error creating business', description: error.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    await updateProfile({ role: 'business', terms_accepted_at: new Date().toISOString(), privacy_accepted_at: new Date().toISOString() } as any);

    if (isEligibleForTrial) {
      await supabase.rpc('record_trial_usage', { p_email: profile.email, p_user_id: user.id, p_business_id: business.id });
    }

    const purchased = await showPaywall(selectedTier as 'basic' | 'pro' | 'elite');
    if (purchased) {
      await refreshSubscription();
    }

    toast({
      title: 'Welcome to Polished!',
      description: isEligibleForTrial
        ? 'Your 1-month free trial has started!'
        : 'Your subscription is now active!',
    });
    navigate('/business/analytics');
    setIsLoading(false);
  };

  // --- TIER SELECTION PHASE ---
  if (phase === 'tier') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Polished for Business</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-primary/10 text-primary border-0 px-4 py-1.5 text-sm">
                🎉 1 Month Free Trial
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Choose Your Plan</h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Start with a free 1-month trial on any plan. No credit card required to begin.
              </p>
            </div>

            {/* Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {subscriptionTiers.map(tier => {
                const isSelected = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 text-left transition-all",
                      isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/40",
                      tier.popular && !isSelected && "border-primary/30"
                    )}
                  >
                    {tier.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                        ⭐ Most Popular
                      </Badge>
                    )}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-4 mt-1">
                      <span className="text-2xl">{tier.icon}</span>
                      <div>
                        <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                        <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                      </div>
                    </div>

                    <div className="mb-5">
                      <span className="text-3xl font-bold text-primary">FREE</span>
                      <span className="text-sm text-muted-foreground ml-2">for 1 month</span>
                      <p className="text-xs text-muted-foreground mt-1">then ${tier.price}/month after trial</p>
                    </div>

                    <ul className="space-y-2">
                      {tier.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Trust indicators */}
            <div className="text-center mb-6">
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
                <span>✅ 1 month free on any plan</span>
                <span>✅ No credit card required to start</span>
                <span>✅ Cancel anytime</span>
                <span>✅ Switch plans anytime</span>
              </div>
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 text-lg px-10 h-14 rounded-xl"
                onClick={() => setPhase('info')}
              >
                Start Free Trial with {subscriptionTiers.find(t => t.id === selectedTier)?.name} Plan
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <div className="mt-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
                  Not now — go back
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ONBOARDING STEPS PHASE ---
  const tierInfo = subscriptionTiers.find(t => t.id === selectedTier)!;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Polished for Business</span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={cn("w-6 h-1.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-muted")} />
          ))}
          <span className="text-xs text-muted-foreground ml-2">Step {step} of {totalSteps}</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1 — Business Info */}
          {step === 1 && (
            <motion.div key="b1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full">
              <div className="text-center mb-6">
                <Badge className="mb-3 bg-primary/10 text-primary border-0">{tierInfo.icon} {tierInfo.name} Plan — 1 Month Free</Badge>
                <div className="text-5xl mb-4">🏢</div>
                <h1 className="font-display text-3xl font-bold mb-2">Tell us about your business</h1>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Business Name</Label>
                  <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your salon or studio name" className="h-12 mt-1.5" />
                </div>
                <div>
                  <Label>Business Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your services, specialties, and what makes you unique..." className="mt-1.5 min-h-[100px]" maxLength={500} />
                  <span className="text-xs text-muted-foreground">{description.length}/500</span>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className="h-12 mt-1.5" />
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setPhase('tier')} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Change Plan</Button>
                  <Button onClick={() => setStep(2)} disabled={!businessName} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Location */}
          {step === 2 && (
            <motion.div key="b2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📍</div>
                <h1 className="font-display text-3xl font-bold mb-2">Where is your business located?</h1>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Street Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main Street" className="h-12 mt-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="h-12 mt-1.5" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={state} onChange={e => setState(e.target.value)} placeholder="FL" maxLength={2} className="h-12 mt-1.5" />
                  </div>
                  <div>
                    <Label>ZIP</Label>
                    <Input value={zip} onChange={e => setZip(e.target.value)} placeholder="32960" className="h-12 mt-1.5" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Categories */}
          {step === 3 && (
            <motion.div key="b3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-lg w-full text-center">
              <div className="text-5xl mb-4">✂️</div>
              <h1 className="font-display text-3xl font-bold mb-2">What type of business is this?</h1>
              <p className="text-muted-foreground mb-6">Select all that apply</p>
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {businessCategories.map(cat => {
                  const selected = categories.includes(cat);
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)}
                      className={cn("px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                      )}
                    >
                      {selected && <Check className="w-3.5 h-3.5 inline mr-1" />}{cat}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(4)} disabled={categories.length === 0} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 4 — Hours */}
          {step === 4 && (
            <motion.div key="b4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🕐</div>
                <h1 className="font-display text-3xl font-bold mb-2">Set your business hours</h1>
                <p className="text-muted-foreground">You can update these anytime in your settings</p>
              </div>
              <div className="space-y-3 mb-8">
                {dayNames.map((day, index) => (
                  <div key={index} className="flex items-center gap-3 py-2">
                    <Switch checked={hours[index].is_open} onCheckedChange={v => updateHour(index, 'is_open', v)} />
                    <span className="w-24 text-sm font-medium">{day}</span>
                    {hours[index].is_open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="time" value={hours[index].open} onChange={e => updateHour(index, 'open', e.target.value)} className="h-9 text-sm" />
                        <span className="text-muted-foreground text-sm">to</span>
                        <Input type="time" value={hours[index].close} onChange={e => updateHour(index, 'close', e.target.value)} className="h-9 text-sm" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(5)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 5 — Community Identity */}
          {step === 5 && (
            <motion.div key="b5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🌟</div>
                <h1 className="font-display text-3xl font-bold mb-2">Community Identity</h1>
                <p className="text-muted-foreground">Help customers find and support businesses like yours. All free, all optional.</p>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  { key: 'is_black_owned' as const, emoji: '🤎', label: 'Black-Owned', desc: 'This business is Black-owned' },
                  { key: 'is_hispanic_owned' as const, emoji: '🧡', label: 'Hispanic & Latino-Owned', desc: 'This business is Hispanic or Latino-owned' },
                  { key: 'is_lgbtq_owned' as const, emoji: '🏳️‍🌈', label: 'LGBTQ+-Owned', desc: 'Owned by an LGBTQ+ individual' },
                  { key: 'is_lgbtq_welcoming' as const, emoji: '🏳️‍🌈', label: 'LGBTQ+ Welcoming', desc: 'Warmly welcomes LGBTQ+ clients' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setIdentity(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      identity[opt.key] ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{opt.label}</p>
                      <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    </div>
                    {identity[opt.key] && <Check className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1 h-12"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
                <Button onClick={() => setStep(6)} className="flex-1 h-12 bg-gradient-primary hover:opacity-90">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </motion.div>
          )}

          {/* Step 6 — Complete */}
          {step === 6 && (
            <motion.div key="b6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-md w-full text-center">
              <div className="text-6xl mb-6">🎉</div>
              <h1 className="font-display text-3xl font-bold mb-4">You're all set!</h1>
              <p className="text-muted-foreground mb-8">
                Your business profile has been created. Your <strong>free 1-month trial</strong> starts today.
              </p>
              <div className="space-y-3 mb-8 text-left bg-muted/50 rounded-xl p-5">
                {[
                  { emoji: '✅', text: 'Add your services and pricing in your dashboard' },
                  { emoji: '📸', text: 'Upload photos to attract more clients' },
                  { emoji: '👥', text: 'Add your staff members' },
                  { emoji: '💳', text: 'Add payment info before your trial ends to stay listed' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span>{item.emoji}</span>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
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
                    Go to My Dashboard <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setStep(5)} className="w-full mt-3 text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusinessOnboarding;
