import { useState, useEffect } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';

export const ExternalPaymentSettings = () => {
  const { businessId } = useAccountType();
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await supabase
        .from('businesses')
        .select('collect_payments_externally')
        .eq('id', businessId)
        .single();
      if (data) setEnabled(!!(data as any).collect_payments_externally);
      setLoading(false);
    })();
  }, [businessId]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({ collect_payments_externally: enabled } as any)
      .eq('id', businessId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: 'Payment collection updated',
        description: enabled
          ? 'Clients will book without entering payment info.'
          : 'Online payments are re-enabled for new bookings.',
      });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between p-4 bg-card rounded-xl border border-border gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Collect payments externally</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Turn this on if you prefer to collect payment directly from clients at the time of service.
              Clients will book without entering payment information. All payments you record manually
              will appear in your analytics and revenue reports.
            </p>
          </div>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {enabled && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
          When enabled, the booking flow will skip the payment step entirely. After completing an
          appointment you'll record the payment method and amount, and it will appear in revenue
          reports tagged as "collected externally".
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Payment Settings'}
      </Button>
    </div>
  );
};
