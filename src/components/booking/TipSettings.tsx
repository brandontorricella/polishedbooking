import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';

export const TipSettings = () => {
  const { businessId } = useAccountType();
  const { toast } = useToast();
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [presets, setPresets] = useState([15, 20, 25]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      const { data } = await supabase
        .from('businesses')
        .select('tips_enabled, tip_presets')
        .eq('id', businessId)
        .single();
      if (data) {
        setTipsEnabled((data as any).tips_enabled ?? true);
        setPresets((data as any).tip_presets || [15, 20, 25]);
      }
      setLoading(false);
    })();
  }, [businessId]);

  const handlePresetChange = (index: number, value: string) => {
    const updated = [...presets];
    updated[index] = parseInt(value) || 0;
    setPresets(updated);
  };

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase
      .from('businesses')
      .update({ tips_enabled: tipsEnabled, tip_presets: presets } as any)
      .eq('id', businessId);
    if (!error) {
      toast({ title: 'Tip settings saved', description: 'Your tip preferences have been updated.' });
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Tips</h3>
        <p className="text-sm text-muted-foreground">
          Allow clients to add a tip when paying. 100% goes to the service provider.
        </p>
      </div>

      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div>
          <p className="font-medium">Enable Tips</p>
          <p className="text-sm text-muted-foreground">Show tip selection during checkout</p>
        </div>
        <Switch checked={tipsEnabled} onCheckedChange={setTipsEnabled} />
      </div>

      {tipsEnabled && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Tip Percentage Options</label>
              <p className="text-xs text-muted-foreground mt-1">
                Set the three percentages shown to clients. They can also enter a custom amount.
              </p>
            </div>
            <div className="flex gap-3">
              {presets.map((preset, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={preset}
                    onChange={(e) => handlePresetChange(i, e.target.value)}
                    className="w-16 text-center font-semibold"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-2">Preview for a $100 service:</p>
              <div className="flex gap-2">
                {presets.map((pct, i) => (
                  <div key={i} className="flex-1 text-center p-2 bg-card border border-border rounded-lg">
                    <p className="text-sm font-bold">{pct}%</p>
                    <p className="text-xs text-muted-foreground">${pct.toFixed(2)}</p>
                  </div>
                ))}
                <div className="flex-1 text-center p-2 bg-card border border-border rounded-lg">
                  <p className="text-sm font-bold">Custom</p>
                  <p className="text-xs text-muted-foreground">$</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-primary">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Tip Settings'}
      </Button>
    </div>
  );
};
