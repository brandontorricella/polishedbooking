import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, User, Heart, Calendar, MessageSquare,
  LogOut, Search, Home, BarChart3, Users, Settings,
  Scissors, UserPlus, LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import polishedLogo from '@/assets/logo-transparent.png';

const guestNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
];

const customerNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

const businessNavItems = [
  { href: '/business/analytics', label: 'Dashboard', icon: BarChart3 },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { accountType } = useAccountType();

  const navItems = accountType === 'business'
    ? businessNavItems
    : accountType === 'customer'
    ? customerNavItems
    : guestNavItems;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      {/* Business mode indicator */}
      {accountType === 'business' && (
        <div className="bg-midnight text-cream text-xs py-1.5 px-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Business Dashboard
          </span>
          <Link to="/search" className="text-cream/70 hover:text-cream transition-colors">
            View as Customer
          </Link>
        </div>
      )}

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={polishedLogo} alt="Polished" className="w-10 h-10 object-contain" />
            <span className="font-display text-xl font-semibold text-gradient">Polished</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <Link
                  key={href}
                  to={href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {accountType === 'guest' && (
              <>
                <Link to="/business" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                    For Business
                  </Button>
                </Link>
                <Link to="/auth?mode=login">
                  <Button variant="outline" size="sm" className="rounded-lg border-2 border-foreground/20 font-semibold">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Log In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button size="sm" className="rounded-lg bg-gradient-primary hover:opacity-90">
                    <UserPlus className="w-4 h-4 mr-1.5" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {accountType === 'customer' && (
              <>
                <Link to="/business" className="hidden sm:block">
                  <Button variant="outline" size="sm" className="rounded-lg">
                    For Business
                  </Button>
                </Link>
                <NotificationBell />
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="rounded-lg">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-lg hidden sm:flex"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}

            {accountType === 'business' && (
              <>
                <NotificationBell />
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="rounded-lg">
                    <Settings className="w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-lg hidden sm:flex"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card border-b border-border overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = location.pathname === href;
                return (
                  <Link
                    key={href}
                    to={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all",
                      isActive 
                        ? "text-primary bg-primary/10" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                );
              })}

              {accountType === 'guest' && (
                <div className="pt-4 border-t border-border mt-4 space-y-2">
                  <Link to="/business" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start" size="lg">
                      For Business
                    </Button>
                  </Link>
                </div>
              )}

              {accountType === 'business' && (
                <div className="pt-4 border-t border-border mt-4">
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start" size="lg">
                      <Search className="w-5 h-5 mr-2" />
                      View as Customer
                    </Button>
                  </Link>
                </div>
              )}

              {user && (
                <div className="pt-4 border-t border-border mt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    size="lg"
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    Sign Out
                  </Button>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
