import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

export const MadeForYouSection = () => {
  const { t } = useTranslation();

  const features = [
    { emoji: '💳', titleKey: 'payYourWay', descKey: 'payYourWayDesc' },
    { emoji: '🌟', titleKey: 'supportCommunity', descKey: 'supportCommunityDesc' },
    { emoji: '🎁', titleKey: 'earnLoyalty', descKey: 'earnLoyaltyDesc' },
    { emoji: '📲', titleKey: 'bookInSeconds', descKey: 'bookInSecondsDesc' },
    { emoji: '💝', titleKey: 'weGiveBack', descKey: 'weGiveBackDesc' },
    { emoji: '✅', titleKey: 'freeToBook', descKey: 'freeToBookDesc' },
  ];

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
            {t('madeForYou', 'badge')}
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">
            {t('madeForYou', 'title')} <span className="text-primary">{t('madeForYou', 'titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('madeForYou', 'desc')}
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
              <h4 className="text-sm font-bold mb-1.5">{t('madeForYou', f.titleKey)}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{t('madeForYou', f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
