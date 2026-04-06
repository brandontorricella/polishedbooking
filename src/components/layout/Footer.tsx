import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import polishedLogo from '@/assets/logo-transparent.png';

export const Footer = () => {
  return (
    <footer className="bg-midnight text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={polishedLogo} alt="Polished" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold text-cream">Polished</span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed">
              Discover and book beauty & wellness services from top-rated professionals near you.
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
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">For Clients</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/search" className="text-cream/70 hover:text-cream transition-colors">Find Services</Link></li>
              <li><Link to="/favorites" className="text-cream/70 hover:text-cream transition-colors">Saved Businesses</Link></li>
              <li><Link to="/bookings" className="text-cream/70 hover:text-cream transition-colors">My Bookings</Link></li>
              <li><Link to="/help" className="text-cream/70 hover:text-cream transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">For Businesses</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/business" className="text-cream/70 hover:text-cream transition-colors">Join Polished</Link></li>
              <li><Link to="/business/pricing" className="text-cream/70 hover:text-cream transition-colors">Pricing</Link></li>
              <li><Link to="/business/analytics" className="text-cream/70 hover:text-cream transition-colors">Analytics</Link></li>
              <li><Link to="/business/resources" className="text-cream/70 hover:text-cream transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold text-cream">Stay Updated</h4>
            <p className="text-sm text-cream/70">Get beauty tips and exclusive deals.</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
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
            © {new Date().getFullYear()} Polished. All rights reserved. Access anywhere from your browser.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-cream/50 hover:text-cream transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-cream/50 hover:text-cream transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="text-cream/50 hover:text-cream transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
