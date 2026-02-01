import { Link } from 'react-router-dom';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import polishedLogo from '@/assets/polished-logo.png';

export const Footer = () => {
  return (
    <footer className="bg-midnight text-cream">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={polishedLogo} alt="Polished" className="w-10 h-10 object-contain" />
              <span className="font-display text-xl font-semibold">Polished</span>
            </Link>
            <p className="text-cream/70 text-sm leading-relaxed">
              Discover and book beauty & wellness services from top-rated professionals near you.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="text-cream/70 hover:text-cream hover:bg-cream/10">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cream/70 hover:text-cream hover:bg-cream/10">
                <Twitter className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-cream/70 hover:text-cream hover:bg-cream/10">
                <Facebook className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* For Clients */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">For Clients</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/search" className="hover:text-cream transition-colors">Find Services</Link></li>
              <li><Link to="/favorites" className="hover:text-cream transition-colors">Saved Businesses</Link></li>
              <li><Link to="/bookings" className="hover:text-cream transition-colors">My Bookings</Link></li>
              <li><Link to="/help" className="hover:text-cream transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* For Businesses */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">For Businesses</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/business" className="hover:text-cream transition-colors">Join Polished</Link></li>
              <li><Link to="/business/pricing" className="hover:text-cream transition-colors">Pricing</Link></li>
              <li><Link to="/business/analytics" className="hover:text-cream transition-colors">Analytics</Link></li>
              <li><Link to="/business/resources" className="hover:text-cream transition-colors">Resources</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Stay Updated</h4>
            <p className="text-sm text-cream/70">Get beauty tips and exclusive deals.</p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Your email" 
                className="bg-cream/10 border-cream/20 text-cream placeholder:text-cream/50"
              />
              <Button className="bg-gradient-primary hover:opacity-90">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-cream/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-cream/50">
            © 2024 Polished. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-cream/50">
            <Link to="/privacy" className="hover:text-cream transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-cream transition-colors">Terms of Service</Link>
            <Link to="/cookies" className="hover:text-cream transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
