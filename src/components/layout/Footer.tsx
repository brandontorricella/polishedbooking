import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/hooks/useTranslation';
import polishedLogo from '@/assets/logo.png';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-midnight text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={polishedLogo} alt="Polished" className="w-14 h-14 object-contain" />
              <span className="font-display text-xl font-semibold text-cream">Polished</span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed">
              {t('footer', 'tagline')}
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-10 h-10 rounded-full border border-cream/30 flex items-center justify-center text-cream/70 hover:border-primary hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-cream/30 flex items-center justify-center text-cream/70 hover:border-primary hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-cream/30 flex items-center justify-center text-cream/70 hover:border-primary hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
            </div>
            {/* Language toggle in footer */}
            <LanguageToggle variant="footer" />
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">{t('footer', 'forClients')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/search" className="text-cream/70 hover:text-cream transition-colors">{t('footer', 'findServices')}</Link></li>
              <li><Link to="/favorites" className="text-cream/70 hover:text-cream transition-colors">{t('footer', 'savedBusinesses')}</Link></li>
              <li><Link to="/bookings" className="text-cream/70 hover:text-cream transition-colors">{t('footer', 'myBookings')}</Link></li>
              <li><Link to="/help" className="text-cream/70 hover:text-cream transition-colors">{t('footer', 'helpCenter')}</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">{t('footer', 'forBusinesses')}</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/for-business" className="text-cream/70 hover:text-cream transition-colors">How It Works for Businesses</Link></li>
              <li><Link to="/for-business#payments" className="text-cream/70 hover:text-cream transition-colors">Payment Options</Link></li>
              <li><Link to="/business/pricing" className="text-cream/70 hover:text-cream transition-colors">{t('footer', 'pricing')}</Link></li>
              <li><Link to="/gives-back" className="text-cream/70 hover:text-cream transition-colors">💝 Gives Back</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">Contact</h4>
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <a href="mailto:support@polishedbooking.com" className="text-[13px] text-primary no-underline font-medium hover:underline">
                  support@polishedbooking.com
                </a>
                <p className="text-[11px] text-cream/40 m-0">Booking help, account issues &amp; technical support</p>
              </div>
              <div className="flex flex-col gap-1">
                <a href="mailto:hello@polishedbooking.com" className="text-[13px] text-primary no-underline font-medium hover:underline">
                  hello@polishedbooking.com
                </a>
                <p className="text-[11px] text-cream/40 m-0">Partnerships, press &amp; general inquiries</p>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">{t('footer', 'stayUpdated')}</h4>
            <p className="text-sm text-cream/70">{t('footer', 'stayUpdatedDesc')}</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder={t('auth', 'email')}
                className="bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50 focus:border-primary"
              />
              <Button className="bg-gradient-primary hover:opacity-90 flex-shrink-0">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cream/50">
            © {new Date().getFullYear()} Polished. {t('footer', 'rights')}
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-cream/50 hover:text-cream transition-colors">{t('footer', 'privacy')}</Link>
            <Link to="/terms" className="text-cream/50 hover:text-cream transition-colors">{t('footer', 'terms')}</Link>
            <Link to="/cookies" className="text-cream/50 hover:text-cream transition-colors">{t('footer', 'cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
