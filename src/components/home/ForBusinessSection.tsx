import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const benefits = [
  { icon: '💳', title: 'Flat monthly pricing', desc: 'No surprise per-booking fees ever. Keep more of what you earn.' },
  { icon: '📲', title: 'Buy Now Pay Later built in', desc: 'Afterpay, Klarna, and Affirm — clients pay over time, you get paid upfront.' },
  { icon: '🤖', title: 'AI weekly business insights', desc: 'Plain-English summaries of your performance every Monday morning.' },
  { icon: '🌟', title: 'Community identity badges', desc: 'Black-Owned, Hispanic-Owned, and LGBTQ+ badges — free on every plan.' },
  { icon: '📥', title: 'Migrate from Vagaro or Booksy', desc: 'Import your client list in 2 minutes. We make switching painless.' },
];

const tiers = [
  { name: 'Basic', price: 29, icon: '✨', highlights: ['Up to 2 staff', 'Appointments & classes', 'BNPL payments', 'Community badges'], popular: false },
  { name: 'Pro', price: 59, icon: '⭐', highlights: ['Up to 5 staff', 'Analytics + AI insights', 'Service packages', 'Priority placement'], popular: true },
  { name: 'Elite', price: 99, icon: '👑', highlights: ['Unlimited staff', 'Featured placement', 'Custom reports', 'Verified badge'], popular: false },
];

export const ForBusinessSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-5 md:px-10 bg-gradient-to-br from-[hsl(240,40%,6%)] via-[hsl(280,30%,8%)] to-[hsl(210,40%,7%)] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-1/2 -right-1/5 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold text-primary bg-primary/15 border border-primary/30 mb-4">
              For Business Owners
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Grow Your Beauty &<br />Wellness Business
            </h2>

            <p className="text-white/60 text-base leading-relaxed mb-8 max-w-lg">
              Join salons, spas, studios, and wellness practitioners already on Polished.
              No per-booking fees. No hardware required. Just more clients.
            </p>

            <div className="flex flex-col gap-4 mb-8">
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-3.5 items-start">
                  <span className="text-xl flex-shrink-0 mt-0.5">{b.icon}</span>
                  <div>
                    <span className="block text-sm font-bold text-white">{b.title}</span>
                    <span className="block text-sm text-white/50 leading-snug">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/signup/business')}
                className="bg-primary hover:bg-primary/80 text-white font-bold text-base px-8 py-6 rounded-xl self-start shadow-[0_8px_24px_hsl(340,75%,55%,0.35)]"
              >
                Start Free Trial →
              </Button>
              <span className="text-sm text-white/40">1 month free · No credit card required · Cancel anytime</span>
            </div>
          </motion.div>

          {/* Right — Pricing Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col gap-3"
          >
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-5 border transition-all ${
                  tier.popular
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-px right-4 bg-primary text-white text-[11px] font-bold px-3 py-1 rounded-b-lg">
                    Most Popular
                  </span>
                )}
                <div className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-xl">{tier.icon}</span>
                  <span className="text-lg font-bold text-white">{tier.name}</span>
                </div>
                <div className="mb-3">
                  <span className="block text-base font-bold text-primary">1 month FREE</span>
                  <span className="block text-xs text-white/40 mt-0.5">then ${tier.price}/mo</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {tier.highlights.map((h, i) => (
                    <li key={i} className="text-sm text-white/65 flex items-center gap-2">
                      <span className="text-green-400 font-bold">✓</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="text-center mt-4">
              <button
                onClick={() => navigate('/business/pricing')}
                className="text-sm text-white/40 underline hover:text-white/60 transition-colors bg-transparent border-none cursor-pointer"
              >
                Compare all features →
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
