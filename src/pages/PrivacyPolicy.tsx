import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/">
            <Button variant="ghost" className="mb-6 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">Last updated: January 2026</p>
              </div>
            </div>

            <div className="prose prose-gray max-w-none space-y-8">
              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to Polished. Your privacy is important to us. This policy explains how we collect, 
                  use, and protect your information when you use our beauty and wellness marketplace platform.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">1. Location Usage</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Polished uses your device location to display businesses and services near you.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>You may allow or deny location access; denying may limit app functionality.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Location data is used only to provide relevant search results and is not shared with third parties.</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">2. Payment Handling</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Payment information for business subscriptions is securely processed through our payment provider (Stripe).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Payment data is encrypted and never stored on your device.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Business subscriptions auto-renew monthly until canceled.</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">3. Account Data Storage</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Account information, bookings, reviews, and preferences are securely stored in our database.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Data is used to provide app services, improve user experience, and for analytics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Users and businesses may request deletion of their account at any time.</span>
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">4. Data Protection</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement industry-standard security measures to protect your personal information. 
                  All data transmissions are encrypted using SSL/TLS protocols. We regularly review and 
                  update our security practices to ensure your data remains safe.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">5. Your Rights</h2>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, correct, or delete your personal data. You can manage 
                  your data preferences in your account settings or contact our support team for assistance.
                </p>
              </section>

              <section>
                <h2 className="font-display text-xl font-semibold mb-4">Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:btorricella816@gmail.com" className="text-primary hover:underline">
                    privacy@polished.app
                  </a>
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
