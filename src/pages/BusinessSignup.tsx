import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Check, Loader2, Lock, XCircle, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogoSpinner } from '@/components/ui/LogoSpinner';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PRICING, getTierPrice, type BillingInterval, type TierId } from '@/constants/pricing';
import polishedLogo from '@/assets/logo.png';

const tierFeatures: Partial<Record<TierId, string[]>> = {
  starter: [
    '1 staff member',
    'Public profile & local search',
    'Online booking',
    'Reviews & ratings',
    'Community identity badges',
    'Client messaging',
  ],
  basic: [
    'Up to 2 staff members',
    'Public profile & local search',
    'Appointment & class booking',
    'Virtual session support',
    'BNPL payments & tip collection',
    'Community identity badges',
    'Intake forms & client messaging',
    'Schedule & time blocking',
  ],
  pro: [
    'Up to 5 staff members',
    'Everything in Basic',
    'Priority search placement',
    '"Recommended" badge',
    'Analytics dashboard + AI insights',
    'Service packages & memberships',
    'Embeddable booking widget',
    'Staff commission tracking',
    'Last minute deals & loyalty program',
  ],
  elite: [
    'Unlimited staff members',
    'Everything in Pro',
    'Featured placement at top of search',
    '"Verified Elite" badge',
    'Homepage & city collections',
    'Custom report builder',
    'Industry benchmarking analytics',
    'Priority support & early access',
  ],
};

const BusinessSignup = () => {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<TierId>('pro');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan && ['basic', 'pro', 'elite'].includes(plan)) {
      setSelectedTier(plan as TierId);
    }
    const billing = searchParams.get('billing');
    if (billing === 'annual') {
      setBillingInterval('annual');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) navigate('/business/analytics');
        });
    }
  }, [user, navigate]);

  const pricing = PRICING[selectedTier];
  const price = getTierPrice(selectedTier, billingInterval);

  function validate() {
    const errs: Record<string, string> = {};
    if (!businessName.trim()) errs.businessName = 'Business name is required';
    if (!ownerName.trim()) errs.ownerName = 'Your name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: ownerName.trim(), account_type: 'business' },
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) { setErrors({ submit: authError.message }); setLoading(false); return; }
      if (!authData.user) { setErrors({ submit: 'Failed to create account. Please try again.' }); setLoading(false); return; }

      await supabase
        .from('profiles')
        .update({ role: 'business' as any, display_name: ownerName.trim() })
        .eq('user_id', authData.user.id);

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      const { error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: authData.user.id,
          name: businessName.trim(),
          email: email.trim(),
          subscription_tier: selectedTier,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
          is_publicly_visible: true,
          is_published: false,
          onboarding_completed: false,
          offers_appointments: true,
          offers_classes: false,
          offers_virtual: false,
        } as any);

      if (bizError) { setErrors({ submit: 'Failed to create business profile. Please try again.' }); setLoading(false); return; }

      toast({ title: 'Account created!', description: 'Please check your email to verify your account.' });
      setStep(3);
      setTimeout(() => navigate('/business/onboarding'), 1500);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 md:px-8 py-4 border-b border-border bg-card">
        <button onClick={() => navigate('/')} className="bg-transparent border-none cursor-pointer p-0">
          <img src={polishedLogo} alt="Polished" className="h-9 w-auto" />
        </button>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Already have an account?</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/auth?mode=login')}>Log In</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center py-6 gap-0 max-w-md mx-auto px-4">
        {[{ num: 1, label: 'Choose Plan' }, { num: 2, label: 'Create Account' }, { num: 3, label: 'Set Up Profile' }].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step > s.num ? 'border-green-500 bg-green-500 text-white' : step === s.num ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground'
              }`}>
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`w-16 md:w-20 h-0.5 mx-2 mb-5 transition-all ${step > s.num ? 'bg-green-500' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="max-w-[1100px] mx-auto px-4 pb-16">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-4">
                <span className="inline-block px-5 py-2 rounded-full text-sm font-bold text-primary bg-primary/10 border border-primary/25 mb-4">
                  🎉 1 Month Free on Any Plan
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Choose Your Plan</h1>
                <p className="text-muted-foreground text-base">Start with a free 1-month trial. No credit card required.</p>
              </div>

              <BillingToggle interval={billingInterval} onChange={setBillingInterval} />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                {(['basic', 'pro', 'elite'] as TierId[]).map(tierId => {
                  const tp = PRICING[tierId];
                  const tierPrice = getTierPrice(tierId, billingInterval);
                  const isPopular = tierId === 'pro';

                  return (
                    <div
                      key={tierId}
                      onClick={() => setSelectedTier(tierId)}
                      className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                        selectedTier === tierId
                          ? 'border-primary bg-primary/5 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]'
                          : 'border-border bg-card hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-lg'
                      } ${isPopular ? 'border-primary/50' : ''}`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-white text-center py-1.5 text-xs font-bold rounded-t-xl">
                          ⭐ Most Popular
                        </div>
                      )}
                      {selectedTier === tierId && (
                        <span className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-lg">✓ Selected</span>
                      )}

                      <div className={isPopular ? 'pt-4' : ''}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{tp.icon}</span>
                          <div>
                            <h3 className="text-xl font-bold">{tp.name}</h3>
                          </div>
                        </div>

                        <div className="mb-1">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-2xl font-extrabold text-primary">FREE</span>
                            <span className="text-sm text-muted-foreground">for 1 month</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            then <strong className="text-foreground">${tierPrice % 1 === 0 ? tierPrice : tierPrice.toFixed(2)}/mo</strong>
                            {billingInterval === 'annual' && <span className="text-xs"> billed annually</span>}
                          </p>
                          {billingInterval === 'annual' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/10 border border-green-500/25 rounded-full text-[11px] font-bold text-green-500">
                              Save ${tp.annualSavings.toFixed(0)}/year
                            </span>
                          )}
                        </div>

                        <ul className="flex flex-col gap-2 border-t border-border pt-4 mt-4">
                          {tierFeatures[tierId].map((f, i) => (
                            <li key={i} className="flex gap-2 items-start text-sm text-muted-foreground">
                              <span className="text-green-500 font-bold flex-shrink-0">✓</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8 text-sm text-muted-foreground">
                <span>✅ 1 month free on any plan</span>
                <span>✅ No credit card required to start</span>
                <span>✅ Cancel anytime</span>
                <span>✅ Switch plans anytime</span>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => setStep(2)}
                  className="bg-primary hover:bg-primary/90 text-white text-lg px-10 h-14 rounded-xl shadow-[0_8px_24px_hsl(340,75%,55%,0.3)]"
                >
                  Continue with {pricing.name} Plan →
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  🔒 Price Lock Guarantee — your rate never increases
                </p>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-lg mx-auto">
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-8">
                <span className="text-2xl">{pricing.icon}</span>
                <div className="flex-1">
                  <span className="block text-sm font-bold">{pricing.name} Plan</span>
                  <span className="block text-xs text-muted-foreground">
                    1 month free · then ${price % 1 === 0 ? price : price.toFixed(2)}/mo
                    {billingInterval === 'annual' ? ' (billed annually)' : ''}
                  </span>
                </div>
                <button onClick={() => setStep(1)} className="text-primary text-sm font-semibold underline bg-transparent border-none cursor-pointer">Change plan</button>
              </div>

              <h1 className="text-2xl md:text-3xl font-bold mb-2">Create Your Business Account</h1>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Your {pricing.name} plan trial starts today — free for 30 days. No credit card needed to get started.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Glow Studio, Maya's Salon" className={errors.businessName ? 'border-destructive' : ''} autoFocus />
                  {errors.businessName && <p className="text-sm text-destructive mt-1">{errors.businessName}</p>}
                </div>
                <div>
                  <Label htmlFor="ownerName">Your Full Name *</Label>
                  <Input id="ownerName" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner or manager's name" className={errors.ownerName ? 'border-destructive' : ''} />
                  {errors.ownerName && <p className="text-sm text-destructive mt-1">{errors.ownerName}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourbusiness.com" className={errors.email ? 'border-destructive' : ''} />
                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" className={errors.password ? 'border-destructive pr-10' : 'pr-10'} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground bg-transparent border-none cursor-pointer p-0">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                </div>

                <div className="flex gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-sm text-muted-foreground leading-relaxed">
                  <span className="text-xl flex-shrink-0">🎉</span>
                  <p className="m-0">
                    Your {pricing.name} plan trial starts today — completely free for 30 days.
                    We'll remind you before it ends. Your rate is price-locked — it will never increase as long as you stay subscribed.
                  </p>
                </div>

                {errors.submit && (
                  <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive">⚠️ {errors.submit}</div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-12 text-base bg-primary hover:bg-primary/90 rounded-xl">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating your account...</> : 'Start Free Trial →'}
                </Button>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-4 pt-4 border-t border-border mt-2">
                  {[
                    { icon: Lock, label: 'Price Lock Guarantee' },
                    { icon: XCircle, label: 'No cancellation fees' },
                    { icon: Calendar, label: 'No long-term contract' },
                    { icon: CreditCard, label: 'No per-booking fees' },
                  ].map((badge, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <badge.icon className="w-3.5 h-3.5" />
                      {badge.label}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By creating an account you agree to our{' '}
                  <Link to="/terms" className="underline">Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="underline">Privacy Policy</Link>.
                </p>

                <button type="button" onClick={() => setStep(1)} className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-transparent border-none cursor-pointer hover:text-foreground transition-colors mx-auto">
                  <ArrowLeft className="w-4 h-4" /> Back to plan selection
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
              <LogoSpinner size="lg" />
              <p className="text-muted-foreground text-lg">Setting up your account...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BusinessSignup;
