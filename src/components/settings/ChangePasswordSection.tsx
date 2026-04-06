import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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

export const ChangePasswordSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === 'google';

  const checks = passwordRequirements.map(r => ({ ...r, valid: r.regex.test(newPassword) }));
  const allValid = checks.every(c => c.valid);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!allValid) { setError('New password does not meet requirements'); return; }
    if (!passwordsMatch) { setError('Passwords do not match'); return; }
    if (currentPassword === newPassword) { setError('New password must be different from current'); return; }

    setLoading(true);

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });

    if (signInError) {
      setError('Current password is incorrect');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setError(updateError.message || 'Failed to update password');
      setLoading(false);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);
    setLoading(false);
    setTimeout(() => setSuccess(false), 5000);
  };

  if (isGoogleUser) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Password</h3>
        <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border border-border">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
            G
          </div>
          <div>
            <p className="font-medium">You signed in with Google</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your password is managed by Google. To change it, visit your{' '}
              <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                Google Account security settings <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h3 className="font-display text-lg font-semibold mb-1">Change Password</h3>
      <p className="text-sm text-muted-foreground mb-6">Update your password to keep your account secure.</p>

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-sm font-medium">
          ✅ Password updated successfully
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        {/* Current */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Current Password</Label>
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-primary hover:underline">
              Forgot your current password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type={showCurrent ? 'text' : 'password'} placeholder="Your current password" className="pl-10 pr-10 h-12" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* New */}
        <div className="space-y-2">
          <Label>New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input type={showNew ? 'text' : 'password'} placeholder="Min 8 characters" className="pl-10 pr-10 h-12" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
          <div className="space-y-1">
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
            <Input type={showConfirm ? 'text' : 'password'} placeholder="Re-enter new password" className={cn("pl-10 pr-10 h-12", confirmPassword && !passwordsMatch && "border-destructive", confirmPassword && passwordsMatch && "border-emerald-500")} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && <p className="text-xs text-destructive">Passwords do not match</p>}
          {passwordsMatch && <p className="text-xs text-emerald-600">✅ Passwords match</p>}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={loading || !allValid || !passwordsMatch || !currentPassword}>
          {loading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>
    </div>
  );
};
