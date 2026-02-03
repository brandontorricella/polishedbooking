import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const StayUpdatedWidget = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  async function handleSubscribe() {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('email_subscribers')
        .select('id, is_active')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existing) {
        if (existing.is_active) {
          setSuccess(true);
          setEmail('');
          return;
        } else {
          // Reactivate
          await supabase
            .from('email_subscribers')
            .update({ is_active: true, unsubscribed_at: null })
            .eq('id', existing.id);
          setSuccess(true);
          setEmail('');
          return;
        }
      }

      // Create new subscriber
      const { error: insertError } = await supabase
        .from('email_subscribers')
        .insert({
          email: email.toLowerCase(),
          user_id: user?.id ?? null
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setEmail('');
    } catch (err) {
      console.error('Subscribe error:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40"
      >
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">You're subscribed!</p>
            <p className="text-xs text-muted-foreground">Check your inbox for updates</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={() => setSuccess(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40"
    >
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, width: 56 }}
            animate={{ opacity: 1, scale: 1, width: 'auto' }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card border border-border rounded-2xl shadow-elevated p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-display font-semibold text-sm">Stay Updated</h4>
                <p className="text-xs text-muted-foreground">Get deals & updates from places you visit</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-10 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />
              <Button
                onClick={handleSubscribe}
                disabled={loading}
                className="h-10 px-4 bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className="w-14 h-14 rounded-full bg-gradient-primary shadow-elevated flex items-center justify-center text-primary-foreground"
          >
            <Mail className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
