import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Heart, Calendar, MessageSquare, BarChart3, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccountType } from '@/hooks/useAccountType';

const guestNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/auth', label: 'Log In', icon: LogIn },
];

const customerNavItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/favorites', label: 'Favorites', icon: Heart },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/profile', label: 'Profile', icon: User },
];

const businessNavItems = [
  { href: '/business/analytics', label: 'Dashboard', icon: BarChart3 },
  { href: '/bookings', label: 'Bookings', icon: Calendar },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Settings', icon: User },
];

export const BottomNav = () => {
  const location = useLocation();
  const { accountType } = useAccountType();

  const navItems = accountType === 'business'
    ? businessNavItems
    : accountType === 'customer'
    ? customerNavItems
    : guestNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className="flex flex-col items-center justify-center flex-1 py-2 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-12 h-1 bg-gradient-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )} 
              />
              <span 
                className={cn(
                  "text-xs mt-1 font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
