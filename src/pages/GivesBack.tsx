import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { GivesBackSection } from '@/components/home/GivesBackSection';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface DonationRecord {
  id: string;
  month: number;
  year: number;
  donation_amount: number;
  cause_id: string;
}

const causeCategories = [
  { icon: '🤎', label: 'Black & Minority Business Support', desc: 'Grants, mentorship, and resources for minority-owned businesses.' },
  { icon: '🌸', label: "Women's Economic Empowerment", desc: 'Programs that help women start, grow, and fund their businesses.' },
  { icon: '🏳️‍🌈', label: 'LGBTQ+ Community Support', desc: 'Organizations providing services and advocacy for LGBTQ+ individuals.' },
  { icon: '💆', label: 'Mental Health & Wellness Access', desc: 'Making mental health and wellness services accessible to underserved communities.' },
];

const GivesBackPage = () => {
  const [history, setHistory] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('donation_records')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .then(({ data }) => {
        setHistory((data || []) as any[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <span className="text-6xl block mb-4">💝</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Polished Gives Back</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              We believe beauty businesses and the communities they serve should thrive together.
              That's why 1% of every Polished subscription goes directly to a community cause
              chosen by our users — every single month.
            </p>
          </motion.div>

          {/* How it works */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { step: '1', title: 'Revenue is tracked', desc: 'Every month we calculate 1% of total subscription revenue collected from businesses on Polished.' },
                { step: '2', title: 'Community votes', desc: 'Clients and businesses vote on three curated causes. The cause with the most votes wins the month.' },
                { step: '3', title: 'We donate', desc: 'The full 1% is donated to the winning cause at the end of the month. We post the receipt publicly.' },
                { step: '4', title: 'We report it', desc: 'Every donation is announced on our social channels and this page with the exact amount donated.' },
              ].map((s) => (
                <div key={s.step} className="bg-secondary rounded-xl p-5">
                  <div className="w-8 h-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cause Categories */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-2xl font-bold mb-2">Causes We Support</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Every cause we consider falls into one of these four categories — reflecting the values of our community.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {causeCategories.map((cat, i) => (
                <div key={i} className="bg-secondary rounded-xl p-5">
                  <span className="text-3xl block mb-2.5">{cat.icon}</span>
                  <h4 className="font-bold text-sm mb-1">{cat.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Donation History */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <h2 className="text-2xl font-bold mb-5">Donation History</h2>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground">Our first donation is coming soon. Stay tuned! 💝</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map(record => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-secondary rounded-xl">
                    <span className="font-semibold text-sm">
                      {new Date(record.year, record.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <span className="text-lg font-extrabold text-primary">${Number(record.donation_amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Voting widget */}
        <GivesBackSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default GivesBackPage;
