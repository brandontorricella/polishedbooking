import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const passwordRequirements = [
  { regex: /.{8,}/, label: 'At least 8 characters' },
  { regex: /[A-Z]/, label: 'One uppercase letter' },
  { regex: /[0-9]/, label: 'One number' },
];

function getStrength(pwd: string) {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: 'bg-destructive', width: 'w-1/5' };
  if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: 'w-2/5' };
  if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-3/5' };
  if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  return { label: 'Good', color: 'bg-lime-500', width: 'w-4/5' };
}

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if we already have a session (user clicked link and session is already set)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checks = passwordRequirements.map(r => ({ ...r, valid: r.regex.test(password) }));
  const allValid = checks.every(c => c.valid);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allValid) { setError('Password does not meet requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message || 'Failed to reset password. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => navigate('/auth'), 3000);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl border border-border p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">Password Reset!</h1>
              <p className="text-muted-foreground">Your password has been updated successfully. Redirecting you to login...</p>
            </div>
            <div className="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin mx-auto" />
            <Button onClick={() => navigate('/auth')} className="w-full bg-gradient-primary hover:opacity-90">
              Go to Login Now
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-border border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold text-gradient">Polished</span>
        </div>

        <div className="space-y-2 mb-6">
          <h1 className="font-display text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 8 characters"
                className="pl-10 pr-10 h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {strength && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", strength.color, strength.width)} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{strength.label}</span>
              </div>
            )}

            <div className="space-y-1 mt-2">
              {checks.map((c) => (
                <div key={c.label} className={cn("flex items-center gap-1.5 text-xs", c.valid ? "text-emerald-600" : "text-muted-foreground")}>
                  <Check className={cn("w-3.5 h-3.5", !c.valid && "opacity-40")} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter your password"
                className={cn("pl-10 pr-10 h-12", confirmPassword && !passwordsMatch && "border-destructive", confirmPassword && passwordsMatch && "border-emerald-500")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && <p className="text-xs text-destructive">Passwords do not match</p>}
            {passwordsMatch && <p className="text-xs text-emerald-600">✅ Passwords match</p>}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-gradient-primary hover:opacity-90 h-12"
            disabled={loading || !allValid || !passwordsMatch}
          >
            {loading ? 'Resetting...' : (
              <span className="flex items-center gap-2">Reset Password <ArrowRight className="w-5 h-5" /></span>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
