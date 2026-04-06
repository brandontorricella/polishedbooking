import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Building2, Users, CreditCard, DollarSign,
  Star, Settings, PanelLeftClose, PanelLeft, Globe, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Overview', exact: true },
  { path: '/admin/businesses', icon: Building2, label: 'Businesses' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { path: '/admin/revenue', icon: DollarSign, label: 'Revenue' },
  { path: '/admin/reviews', icon: Star, label: 'Reviews' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(0,0%,6%)] text-cream">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-[hsl(0,0%,15%)] bg-[hsl(0,0%,8%)] transition-all duration-200',
          collapsed ? 'w-16' : 'w-56'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-14 border-b border-[hsl(0,0%,15%)]">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-xs font-bold text-white shrink-0">
            P
          </div>
          {!collapsed && <span className="font-display text-lg font-semibold">Admin</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-cream/60 hover:text-cream hover:bg-cream/5'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-[hsl(0,0%,15%)] p-2 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream/50 hover:text-cream hover:bg-cream/5"
          >
            <Globe className="w-4 h-4 shrink-0" />
            {!collapsed && <span>View Site</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-cream/50 hover:text-cream hover:bg-cream/5 w-full"
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-[hsl(0,0%,15%)] bg-[hsl(0,0%,8%)] flex items-center justify-between px-6">
          <h2 className="text-sm font-medium text-cream/70">Polished Admin</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-cream/50">{profile?.display_name || 'Admin'}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-cream/50 hover:text-cream">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
