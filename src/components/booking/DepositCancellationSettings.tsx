import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ShieldAlert, Eye, Smile, Scale, Lock, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface DepositSettings {
  deposit_required: boolean;
  deposit_type: string;
  deposit_amount: number;
  cancellation_policy: string;
  cancellation_hours: number;
  cancellation_fee_type: string;
  cancellation_fee_amount: number;
}

const policyPresets = [
  { key: 'flexible', icon: Smile, name: 'Flexible', desc: 'Free cancellation anytime', hours: 0 },
  { key: 'moderate', icon: Scale, name: 'Moderate', desc: 'Free if canceled 24h before', hours: 24 },
  { key: 'strict', icon: Lock, name: 'Strict', desc: 'Free if canceled 48h before', hours: 48 },
  { key: 'custom', icon: Pencil, name: 'Custom', desc: 'Set your own terms', hours: 24 },
];

export const DepositCancellationSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { businessId } = useAccountType();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<DepositSettings>({
    deposit_required: false,
    deposit_type: 'percentage',
    deposit_amount: 25,
    cancellation_policy: 'flexible',
    cancellation_hours: 24,
    cancellation_fee_type: 'deposit',
    cancellation_fee_amount: 0,
  });

  useEffect(() => {
    if (!businessId) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('deposit_required, deposit_type, deposit_amount, cancellation_policy, cancellation_hours, cancellation_fee_type, cancellation_fee_amount')
        .eq('id', businessId)
        .single();

      if (data) {
        setSettings({
          deposit_required: data.deposit_required ?? false,
          deposit_type: data.deposit_type ?? 'percentage',
          deposit_amount: data.deposit_amount ?? 25,
          cancellation_policy: data.cancellation_policy ?? 'flexible',
          cancellation_hours: data.cancellation_hours ?? 24,
          cancellation_fee_type: data.cancellation_fee_type ?? 'deposit',
          cancellation_fee_amount: data.cancellation_fee_amount ?? 0,
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, [businessId]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update(settings)
      .eq('id', businessId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } else {
      toast({ title: 'Settings Saved', description: 'Your deposit & cancellation policy has been updated.' });
    }
    setSaving(false);
  };

  const getDepositPreview = (servicePrice = 100) => {
    if (!settings.deposit_required) return 'No deposit required';
    if (settings.deposit_type === 'percentage') {
      return `$${((servicePrice * settings.deposit_amount) / 100).toFixed(2)} deposit on a $${servicePrice} service`;
    }
    return `$${settings.deposit_amount.toFixed(2)} flat deposit`;
  };

  const getCancellationPreview = () => {
    if (settings.cancellation_policy === 'flexible') return 'Free cancellation anytime';
    const hours = settings.cancellation_hours;
    const timeLabel = hours >= 48 ? `${hours / 24} days` : `${hours} hours`;
    if (settings.cancellation_fee_type === 'deposit') return `Cancel ${timeLabel}+ before for free, or forfeit deposit`;
    if (settings.cancellation_fee_type === 'percentage') return `Cancel ${timeLabel}+ before for free, or pay ${settings.cancellation_fee_amount}% fee`;
    return `Cancel ${timeLabel}+ before for free, or pay $${settings.cancellation_fee_amount} fee`;
  };

  if (loading) {
    return <div className="animate-pulse h-64 bg-muted rounded-2xl" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Deposit Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Deposit Requirement</CardTitle>
                <p className="text-sm text-muted-foreground">Require clients to pay a deposit when booking</p>
              </div>
            </div>
            <Switch
              checked={settings.deposit_required}
              onCheckedChange={(checked) => setSettings({ ...settings, deposit_required: checked })}
            />
          </div>
        </CardHeader>

        {settings.deposit_required && (
          <CardContent className="space-y-4 border-t border-border pt-4">
            {/* Deposit Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Deposit Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['percentage', 'fixed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSettings({ ...settings, deposit_type: type })}
                    className={cn(
                      "p-3 rounded-xl border text-sm font-medium transition-all text-left",
                      settings.deposit_type === type
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {type === 'percentage' ? 'Percentage of service price' : 'Fixed dollar amount'}
                  </button>
                ))}
              </div>
            </div>

            {/* Deposit Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {settings.deposit_type === 'percentage' ? 'Deposit Percentage' : 'Deposit Amount'}
              </label>
              <div className="flex items-center gap-2">
                {settings.deposit_type === 'fixed' && <span className="text-muted-foreground">$</span>}
                <Input
                  type="number"
                  min={1}
                  max={settings.deposit_type === 'percentage' ? 100 : 500}
                  value={settings.deposit_amount}
                  onChange={(e) => setSettings({ ...settings, deposit_amount: parseFloat(e.target.value) || 0 })}
                  className="w-24"
                />
                {settings.deposit_type === 'percentage' && <span className="text-muted-foreground">%</span>}
              </div>
            </div>

            {/* Preview */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
              <Eye className="w-4 h-4 shrink-0" />
              <span>{getDepositPreview()}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Cancellation Policy Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Cancellation Policy</CardTitle>
              <p className="text-sm text-muted-foreground">Set rules for when clients can cancel</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Policy Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {policyPresets.map(({ key, icon: Icon, name, desc, hours }) => (
              <button
                key={key}
                onClick={() => setSettings({
                  ...settings,
                  cancellation_policy: key,
                  ...(key !== 'custom' ? { cancellation_hours: hours } : {}),
                  ...(key === 'flexible' ? { cancellation_fee_type: 'deposit', cancellation_fee_amount: 0 } : {}),
                })}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all",
                  settings.cancellation_policy === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn("w-5 h-5", settings.cancellation_policy === key ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-semibold", settings.cancellation_policy === key ? "text-primary" : "text-foreground")}>{name}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{desc}</span>
              </button>
            ))}
          </div>

          {/* Custom Settings */}
          {settings.cancellation_policy !== 'flexible' && (
            <div className="space-y-4 p-4 rounded-xl bg-muted/50">
              <div className="space-y-2">
                <label className="text-sm font-medium">Free Cancellation Window</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={settings.cancellation_hours}
                    onChange={(e) => setSettings({ ...settings, cancellation_hours: parseInt(e.target.value) || 24 })}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">hours before appointment</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Late Cancellation Fee</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'deposit', label: 'Forfeit deposit' },
                    { key: 'percentage', label: '% of service' },
                    { key: 'fixed', label: 'Fixed fee' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSettings({ ...settings, cancellation_fee_type: key })}
                      className={cn(
                        "p-2 rounded-lg border text-sm transition-all",
                        settings.cancellation_fee_type === key
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border text-foreground"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {settings.cancellation_fee_type !== 'deposit' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fee Amount</label>
                  <div className="flex items-center gap-2">
                    {settings.cancellation_fee_type === 'fixed' && <span className="text-muted-foreground">$</span>}
                    <Input
                      type="number"
                      min={1}
                      value={settings.cancellation_fee_amount}
                      onChange={(e) => setSettings({ ...settings, cancellation_fee_amount: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    {settings.cancellation_fee_type === 'percentage' && <span className="text-muted-foreground">%</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <Eye className="w-4 h-4 shrink-0" />
            <span>{getCancellationPreview()}</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary hover:opacity-90" size="lg">
        {saving ? 'Saving...' : 'Save Policy'}
      </Button>
    </div>
  );
};
