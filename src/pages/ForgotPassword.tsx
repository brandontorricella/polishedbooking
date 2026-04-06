import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Send className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                We sent a password reset link to <span className="font-medium text-foreground">{email}</span>.
                Check your inbox and click the link to reset your password.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Didn't receive it? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">
                try again
              </button>.
            </p>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-gradient">Polished</span>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="font-display text-3xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 h-12"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
