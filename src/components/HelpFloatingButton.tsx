import { useState } from 'react';
import { X, HelpCircle, Mail, Handshake, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const HelpFloatingButton = () => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();

  // Only show for guests (not logged in)
  if (user) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex flex-col items-end gap-2.5">
      {expanded && (
        <div className="bg-card border border-border rounded-2xl p-5 w-72 shadow-xl relative">
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-3 right-3 bg-transparent border-none text-muted-foreground hover:text-foreground cursor-pointer p-0"
          >
            <X className="w-4 h-4" />
          </button>
          <h4 className="text-sm font-semibold mb-3.5 pr-5">How can we help?</h4>

          <a
            href="mailto:support@polishedbooking.com?subject=I need help with Polished"
            className="flex gap-3 items-start p-2.5 rounded-xl no-underline hover:bg-secondary transition-colors mb-1.5"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-foreground">Get Support</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Booking, account and tech help</span>
            </div>
          </a>

          <a
            href="mailto:hello@polishedbooking.com?subject=Inquiry about Polished"
            className="flex gap-3 items-start p-2.5 rounded-xl no-underline hover:bg-secondary transition-colors mb-1.5"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Handshake className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-foreground">Say Hello</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Partnerships and general questions</span>
            </div>
          </a>

          <a
            href="mailto:hello@polishedbooking.com?subject=I want to list my business on Polished"
            className="flex gap-3 items-start p-2.5 rounded-xl no-underline hover:bg-secondary transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="block text-xs font-semibold text-foreground">List My Business</span>
              <span className="block text-[11px] text-muted-foreground mt-0.5">Questions before signing up</span>
            </div>
          </a>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-12 h-12 rounded-full border-none text-lg font-bold cursor-pointer transition-all flex items-center justify-center shadow-lg ${
          expanded
            ? 'bg-secondary text-foreground border border-border'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
        }`}
        aria-label="Help"
      >
        {expanded ? <X className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
      </button>
    </div>
  );
};
