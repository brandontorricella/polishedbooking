import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Lock, XCircle, Calendar, CreditCard } from 'lucide-react';

const businessTypes = [
  { icon: '💇', type: 'Hair Salons & Barbershops' },
  { icon: '💅', type: 'Nail Studios' },
  { icon: '🧖', type: 'Spas & Med Spas' },
  { icon: '💋', type: 'Makeup Artists' },
  { icon: '🧘', type: 'Yoga & Pilates Studios' },
  { icon: '💪', type: 'Personal Trainers' },
  { icon: '👁', type: 'Lash & Brow Studios' },
  { icon: '🧘', type: 'Massage Therapists' },
  { icon: '📍', type: 'Acupuncturists' },
  { icon: '🎯', type: 'Health & Life Coaches' },
  { icon: '💉', type: 'PMU Artists' },
  { icon: '🌿', type: 'Holistic Wellness' },
];

const paymentScenarios = [
  {
    icon: '🌐',
    scenario: 'Client books online',
    how: 'Client pays the full amount or a deposit when booking through Polished. Supports credit/debit cards, Apple Pay, Google Pay, Afterpay, Klarna, and Affirm.',
    hardware: false,
  },
  {
    icon: '📱',
    scenario: 'Client pays in person — no hardware',
    how: 'Use Tap to Pay on your iPhone or Android. Client taps their phone or contactless card on your device. No card reader needed.',
    hardware: false,
  },
  {
    icon: '🔗',
    scenario: 'Send a payment link',
    how: 'After the appointment, send the client a secure Stripe payment link via text or email. They pay on their phone in seconds.',
    hardware: false,
  },
  {
    icon: '💳',
    scenario: 'Use your existing Stripe reader',
    how: 'Already have a Stripe Terminal reader (M2, WisePOS E, S700)? Register it in your Polished settings and accept in-person card payments directly.',
    hardware: true,
  },
  {
    icon: '💵',
    scenario: 'Cash payments',
    how: 'Record cash payments in Polished with one tap. The booking closes as paid and shows in your revenue reports alongside online payments.',
    hardware: false,
  },
  {
    icon: '💜',
    scenario: 'Venmo, Zelle, or other apps',
    how: 'Record off-platform payments in Polished. Choose the payment method, add a note, and mark the booking as paid.',
    hardware: false,
  },
];

const hardwareRows = [
  { hw: 'Stripe Terminal (M2, WisePOS, S700)', compat: '✅ Yes', status: 'yes', alt: 'Register in settings — works natively' },
  { hw: 'Square Reader / Terminal', compat: '❌ No', status: 'no', alt: 'Use Tap to Pay on your phone — free' },
  { hw: 'Clover', compat: '❌ No', status: 'no', alt: 'Use Tap to Pay on your phone — free' },
  { hw: 'Vagaro POS', compat: '❌ No', status: 'no', alt: 'Use Tap to Pay on your phone — free' },
  { hw: 'Generic bank terminal', compat: '⚡ Separate', status: 'partial', alt: 'Continue using it + record payments in Polished' },
];

const faqItems = [
  {
    q: 'Do I need to buy any hardware to use Polished?',
    a: "No. Polished works entirely on your existing phone and computer. Online bookings are paid through Stripe in the browser. In-person payments use Tap to Pay on your phone — no card reader needed. If you already own a Stripe Terminal reader, you can connect it, but it's never required.",
  },
  {
    q: 'What if my clients currently use Square or Clover to pay?',
    a: "Your clients don't interact with Square or Clover — those are your back-end processors. Your clients just tap their card or phone to pay. Polished processes in-person payments through Stripe. For walk-ins who currently swipe at a Square reader, you have three options: use Tap to Pay on your phone, send them a payment link, or continue using your Square reader and record the payment manually in Polished.",
  },
  {
    q: 'Can I still take cash?',
    a: 'Absolutely. Cash payments are recorded in Polished with one tap. The booking is marked as paid and the amount appears in your revenue reports alongside all other payment types.',
  },
  {
    q: 'What does Polished charge per transaction?',
    a: "Polished charges nothing per transaction. The only processing fee is Stripe's standard rate of 2.9% + 30¢ per online transaction — the same rate you'd pay on any modern platform. There are no additional Polished platform fees on top of that.",
  },
  {
    q: 'Can I accept Afterpay or Klarna in person?',
    a: "BNPL options (Afterpay, Klarna, Affirm) are available for online bookings where the client pays through Polished's booking flow. For in-person payments, BNPL is not currently available — clients would use Tap to Pay, a payment link, or a card reader.",
  },
  {
    q: 'How do I switch from Vagaro or Booksy?',
    a: 'We make switching as easy as possible. Import your client list via CSV in under 2 minutes. We provide email templates to notify your clients. And we offer a free 15-minute setup call where our team helps you get everything configured. Most businesses are fully set up within a day.',
  },
  {
    q: 'What happens if my internet goes down during a payment?',
    a: "For Tap to Pay and Terminal payments, Stripe requires an internet connection. If connectivity drops, fall back to cash or Venmo and record it manually in Polished once you're back online. Payment links work whenever the client has internet on their phone, independent of your connection.",
  },
];

const ForBusiness = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1000px] mx-auto px-5 pb-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-midnight to-[#0f0520] rounded-2xl px-8 md:px-12 py-16 my-10 text-white"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/15 border border-primary/30 rounded-full text-xs font-bold text-primary mb-4">
            For Business Owners
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white">
            Everything Your Beauty &<br />Wellness Business Needs
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-xl mb-8">
            Polished is built for salons, spas, yoga studios, massage therapists,
            coaches, and every type of beauty and wellness business. No hardware
            required. No per-booking fees. Just more clients.
          </p>
          <div className="flex items-center gap-5 flex-wrap">
            <Button
              size="lg"
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => navigate('/signup/business')}
            >
              Start Free Trial →
            </Button>
            <span className="text-sm text-white/50">1 month free · No credit card required</span>
          </div>
        </motion.div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold mb-6">Built for Every Type of Business</h2>
          <div className="flex flex-wrap gap-2.5">
            {businessTypes.map((b, i) => (
              <span
                key={i}
                className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full text-sm font-medium"
              >
                {b.icon} {b.type}
              </span>
            ))}
          </div>
        </section>

        {/* Payment Scenarios */}
        <section id="payments" className="mb-16 bg-secondary/50 rounded-2xl p-8">
          <h2 className="text-2xl font-extrabold mb-2">
            <CreditCard className="inline w-6 h-6 mr-2 text-primary" />
            Accepting Payments — Every Scenario Covered
          </h2>
          <p className="text-muted-foreground mb-6">
            Polished handles payments flexibly — online, in-person, and everything in between.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {paymentScenarios.map((s, i) => (
              <div key={i} className="flex gap-3.5 p-4 bg-card border border-border rounded-xl">
                <span className="text-2xl shrink-0">{s.icon}</span>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{s.scenario}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{s.how}</p>
                  {!s.hardware ? (
                    <span className="text-xs font-semibold text-green-500">✅ No hardware required</span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-500">💳 Requires Stripe Terminal reader</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Hardware Table */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold text-base mb-4">What About My Existing Hardware?</h3>
            <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr] gap-3 px-3 pb-2 text-xs font-bold text-muted-foreground uppercase">
              <span>Hardware</span>
              <span>Compatible?</span>
              <span>Alternative</span>
            </div>
            <div className="divide-y divide-border">
              {hardwareRows.map((row, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_2fr] gap-1 sm:gap-3 px-3 py-3 text-sm">
                  <span className="font-medium">{row.hw}</span>
                  <span className={
                    row.status === 'yes' ? 'text-green-500 font-bold'
                    : row.status === 'no' ? 'text-destructive font-bold'
                    : 'text-amber-500 font-bold'
                  }>
                    {row.compat}
                  </span>
                  <span className="text-muted-foreground">{row.alt}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold mb-6">Common Questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`fb-faq-${i}`} className="border border-border rounded-xl px-5">
                <AccordionTrigger className="text-sm font-semibold text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="text-center py-16 px-6 bg-secondary/50 rounded-2xl">
          <h2 className="text-3xl font-extrabold mb-3">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-6">
            Join beauty and wellness businesses already growing on Polished.
          </p>
          <div className="flex gap-3 justify-center flex-wrap mb-4">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90" onClick={() => navigate('/signup/business')}>
              Start Free Trial →
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')}>
              View Pricing
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            🔒 Price Lock Guarantee · ❌ No cancellation fees · 📅 No long-term contract
          </p>
        </section>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default ForBusiness;
