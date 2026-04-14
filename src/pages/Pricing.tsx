import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Sparkles, Lock as LockIcon, CreditCard, Calendar, Gift, RefreshCw, XCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { useSubscription } from '@/hooks/useSuperwall';
import { useAuth } from '@/hooks/useAuth';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PRICING, getTierPrice, PAID_TIER_IDS, type BillingInterval, type TierId } from '@/constants/pricing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const starterFeatures = [
  { text: '1 staff member', locked: false },
  { text: 'Public profile & local search', locked: false },
  { text: 'Online booking', locked: false },
  { text: 'Reviews & ratings', locked: false },
  { text: 'Community identity badges', locked: false },
  { text: 'Client messaging', locked: false },
  { text: 'BNPL payments', locked: true },
  { text: 'Analytics dashboard', locked: true },
  { text: 'Priority placement', locked: true },
];

const paidTiers = [
  {
    id: 'basic' as TierId,
    icon: Sparkles,
    features: [
      'Up to 2 staff members',
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
    id: 'pro' as TierId,
    icon: Star,
    features: [
      'Everything in Basic',
      'Up to 5 staff members',
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
    id: 'elite' as TierId,
    icon: Crown,
    features: [
      'Everything in Pro',
      'Unlimited staff members',
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

const noContractItems = [
  { icon: Calendar, title: 'No long-term contract', desc: "Month-to-month by default. Stay because you love it, not because you're locked in." },
  { icon: XCircle, title: 'No cancellation fees', desc: 'Cancel anytime with no penalties, no questions asked, no runaround.' },
  { icon: RefreshCw, title: 'Switch plans anytime', desc: 'Upgrade or downgrade at any time. Changes take effect on your next billing date.' },
  { icon: Gift, title: '1 month free to start', desc: 'Every paid plan starts with a free month. No credit card required to begin.' },
];

const faqItems = [
  { q: 'Do I need a credit card to start?', a: "No. Your free month starts with just your email and password. We ask for payment info before your trial ends to keep your listing active." },
  { q: 'What happens when my free month ends?', a: "We'll email you a reminder before your trial ends. If you've added a payment method, billing begins automatically. If not, your listing is paused until you add one — no charges ever happen without your knowledge." },
  { q: 'Can I switch from monthly to annual later?', a: "Yes. Switch to annual billing anytime from your dashboard settings and you'll get the 10% discount from your next billing date." },
  { q: 'What is the Price Lock Guarantee?', a: 'Your subscription rate never increases as long as you stay subscribed. If Polished raises prices for new customers, existing customers keep their current rate forever.' },
  { q: 'Are there fees on top of my subscription?', a: "The only additional fee is Stripe's standard payment processing rate (2.9% + 30¢ per transaction). Polished charges zero platform fees on top of that." },
  { q: 'What is the Starter plan?', a: 'Starter is free forever — instead of a monthly fee, Polished takes a 3% fee on each booking. It\'s perfect for solo practitioners just getting started. Upgrade to Basic anytime to remove the booking fee and unlock more features.' },
  { q: 'How do I collect payment from clients who pay in person?', a: 'Polished offers four in-person payment options: (1) Tap to Pay — client taps their phone or card on your device, no hardware needed. (2) Payment Link — send the client a Stripe link by text or email they pay from their phone. (3) Stripe Terminal — if you already own a Stripe reader, register it in your settings. (4) Cash / Venmo / Zelle — record any off-platform payment manually and it shows in your revenue reports.' },
  { q: 'Can I use my existing Square or Clover hardware?', a: "Square and Clover readers are not compatible with Polished — they only work within their own closed ecosystems. However, you don't need hardware at all. Tap to Pay on your existing iPhone or Android replaces a card reader for free. For any remaining transactions, you can continue using your current hardware and record those payments manually in Polished." },
  { q: 'Is Tap to Pay really free? What does it require?', a: "Yes, Tap to Pay is free to use — no hardware purchase, no setup fee. You need an iPhone XS or later (iOS 16+) or a modern Android with NFC. Stripe's standard processing rate of 2.9% + 30¢ applies per transaction, same as any other payment method." },
];

const PricingPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isSubscribed, subscription, startCheckout, manageSubscription } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');

  const handleSelectTier = async (tierId: string) => {
    if (!user || profile?.role !== 'business') {
      navigate(`/signup/business?plan=${tierId}&billing=${billingInterval}`);
      return;
    }
    if (isSubscribed) {
      await manageSubscription();
    } else {
      await startCheckout(tierId as 'basic' | 'pro' | 'elite');
    }
  };

  const getButtonText = (tierId: string) => {
    if (!user || profile?.role !== 'business') return tierId === 'starter' ? 'Get Started Free' : 'Start Free Trial';
    if (subscription?.tier === tierId && isSubscribed) return 'Current Plan';
    if (isSubscribed) return 'Switch Plan';
    return tierId === 'starter' ? 'Get Started Free' : 'Start Free Trial';
  };

  const isCurrentPlan = (tierId: string) => isSubscribed && subscription?.tier === tierId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-4">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              No per-booking fees on paid plans. No hidden charges. No surprises. Start free or go all-in with a flat monthly rate.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <BillingToggle interval={billingInterval} onChange={setBillingInterval} />

          {/* Tier Cards — 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
            {/* Starter Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                isCurrentPlan('starter')
                  ? 'border-green-500 bg-green-500/5 shadow-elevated'
                  : 'border-green-500/40 bg-card'
              }`}
            >
              {isCurrentPlan('starter') && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">Your Plan</Badge>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-500/10">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-display text-xl font-bold">Starter</h3>
              </div>

              <div className="mb-1">
                <span className="text-4xl font-bold">FREE</span>
                <span className="text-muted-foreground"> forever</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                We take <strong className="text-foreground">3% per booking</strong> instead of a monthly fee
              </p>

              <ul className="space-y-3 mb-6 flex-1">
                {starterFeatures.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {f.locked ? (
                      <LockIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                    ) : (
                      <Check className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-500" />
                    )}
                    <span className={`text-sm ${f.locked ? 'text-muted-foreground/50 line-through' : ''}`}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectTier('starter')}
                disabled={isCurrentPlan('starter')}
                variant="outline"
                className={`w-full ${
                  isCurrentPlan('starter')
                    ? 'bg-green-500/20 text-green-700 cursor-default'
                    : 'border-green-500 text-green-500 hover:bg-green-500 hover:text-white'
                }`}
              >
                {getButtonText('starter')}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2 italic">
                Upgrade to Basic anytime to remove the booking fee
              </p>
            </motion.div>

            {/* Paid Tier Cards */}
            {paidTiers.map((tier, index) => {
              const Icon = tier.icon;
              const isCurrent = isCurrentPlan(tier.id);
              const pricing = PRICING[tier.id];
              const price = getTierPrice(tier.id, billingInterval);

              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index + 1) * 0.1 }}
                  className={`relative rounded-2xl border ${
                    isCurrent
                      ? 'border-green-500 bg-green-500/5 shadow-elevated'
                      : tier.recommended
                        ? 'border-primary bg-card shadow-elevated'
                        : 'border-border bg-card'
                  } p-6 flex flex-col`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white">Your Plan</Badge>
                  )}
                  {!isCurrent && tier.recommended && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Most Popular</Badge>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isCurrent ? 'bg-green-500/10' : tier.recommended ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <Icon className={`w-6 h-6 ${isCurrent ? 'text-green-500' : tier.recommended ? 'text-primary' : 'text-foreground'}`} />
                    </div>
                    <h3 className="font-display text-xl font-bold">{pricing.name}</h3>
                  </div>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-2xl font-extrabold text-primary">FREE</span>
                    <span className="text-sm text-muted-foreground">first month</span>
                  </div>

                  <div className="mb-1">
                    <span className="text-4xl font-bold">${price % 1 === 0 ? price : price.toFixed(2)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>

                  {billingInterval === 'annual' ? (
                    <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
                      <span className="text-muted-foreground">Billed ${pricing.annualTotal.toFixed(0)}/year</span>
                      <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/25 rounded-full font-bold text-green-500">
                        Save ${pricing.annualSavings.toFixed(0)}/yr
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-6">
                      or ${pricing.annualMonthly.toFixed(2)}/mo billed annually
                    </p>
                  )}

                  <ul className="space-y-3 mb-6 flex-1">
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
                        : tier.recommended ? 'bg-gradient-primary hover:opacity-90' : ''
                    }`}
                    variant={isCurrent ? 'secondary' : tier.recommended ? 'default' : 'outline'}
                  >
                    {getButtonText(tier.id)}
                  </Button>
                  {!isCurrent && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      🔒 Price Lock Guarantee — your rate never increases
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Fee Transparency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-secondary/50 rounded-2xl p-8 text-center mb-8"
          >
            <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" /> Payment Processing — No Surprises
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mx-auto mb-6">
              Stripe processes all payments on Polished. The standard Stripe fee is{' '}
              <strong className="text-foreground">2.9% + 30¢ per transaction</strong>. That's it.
              Polished charges <strong className="text-foreground">zero additional platform fees</strong> on paid plans.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <div className="flex flex-col gap-1 p-4 bg-card border border-border rounded-xl text-left">
                <span className="text-sm font-bold">Vagaro</span>
                <span className="text-xs text-muted-foreground">Monthly fee + per-booking fee + processing</span>
              </div>
              <div className="flex flex-col gap-1 p-4 bg-card border border-green-500/30 rounded-xl text-left">
                <span className="text-sm font-bold text-green-500">Polished ✓</span>
                <span className="text-xs text-muted-foreground">Flat monthly fee + standard Stripe rate only</span>
              </div>
            </div>
          </motion.div>

          {/* Price Lock Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex gap-5 items-start p-7 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl mb-8"
          >
            <LockIcon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold mb-2">Polished Price Lock Guarantee</h3>
              <p className="text-sm text-muted-foreground leading-relaxed m-0">
                Your subscription rate never increases as long as you stay subscribed.
                If we raise prices for new customers in the future, your rate stays exactly
                where it is today. We believe businesses deserve pricing they can plan around.
              </p>
            </div>
          </motion.div>

          {/* No Contract */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
          >
            {noContractItems.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <div key={i} className="flex gap-4 items-start p-5 bg-card border border-border rounded-xl">
                  <ItemIcon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed m-0">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h3 className="text-2xl font-bold mb-6">Common Questions</h3>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5">
                  <AccordionTrigger className="text-sm font-semibold text-left">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <div className="text-center pt-5 border-t border-border mt-2">
            <p className="text-sm text-muted-foreground m-0">
              Have a question not answered above?{' '}
              <a href="mailto:support@polishedbooking.com?subject=Pricing question — Polished" className="text-primary no-underline font-medium hover:underline">
                Email us at support@polishedbooking.com
              </a>{' '}
              and we respond within one business day.
            </p>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default PricingPage;
