import { motion } from 'framer-motion';

const features = [
  { emoji: '💳', title: 'Pay Your Way', desc: 'Afterpay, Klarna, Affirm, Apple Pay, Google Pay — pay how you want for every appointment.' },
  { emoji: '🌟', title: 'Support Your Community', desc: 'Discover and book with Black-Owned, Hispanic-Owned, and LGBTQ+ businesses in your area.' },
  { emoji: '🎁', title: 'Earn Loyalty Points', desc: 'Every booking earns points you can redeem for discounts on future appointments.' },
  { emoji: '📲', title: 'Book in Seconds', desc: 'No phone calls. No waiting on hold. Book any time, from anywhere, in seconds.' },
  { emoji: '💝', title: 'We Give Back', desc: '1% of every subscription goes to a cause chosen by our community every month.' },
  { emoji: '✅', title: 'Free to Book', desc: 'Creating an account and booking is always free for clients. No hidden fees, ever.' },
];

export const MadeForYouSection = () => {
  return (
    <section className="py-16 md:py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-sm font-bold text-primary bg-primary/10 border border-primary/25 mb-4">
            Built Different
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            Beauty & Wellness, Built for the <span className="text-primary">Next Generation</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Polished is designed for people who expect more — from their beauty experience and from the platforms they use.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:-translate-y-0.5 transition-all hover:shadow-lg"
            >
              <span className="text-3xl block mb-3">{f.emoji}</span>
              <h4 className="text-sm font-bold mb-1.5">{f.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
