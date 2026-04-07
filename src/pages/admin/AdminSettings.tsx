import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const { data } = await supabase.from('platform_settings').select('setting_key, setting_value');
    const map: Record<string, string> = {};
    data?.forEach(d => { map[d.setting_key] = d.setting_value; });
    setSettings(map);
    setLoading(false);
  }

  function update(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('platform_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
    }
    setSaving(false);
    toast({ title: 'Settings saved!' });
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Platform Settings</h1>

      <div className="max-w-2xl space-y-6">
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader><CardTitle className="text-cream text-base">General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-cream/70 text-sm">Platform Name</Label>
              <Input
                value={settings.platform_name || ''}
                onChange={(e) => update('platform_name', e.target.value)}
                className="mt-1 bg-[hsl(0,0%,14%)] border-[hsl(0,0%,20%)] text-cream"
              />
            </div>
            <div>
              <Label className="text-cream/70 text-sm">Support Email</Label>
              <Input
                value={settings.support_email || ''}
                onChange={(e) => update('support_email', e.target.value)}
                className="mt-1 bg-[hsl(0,0%,14%)] border-[hsl(0,0%,20%)] text-cream"
              />
            </div>
            <div>
              <Label className="text-cream/70 text-sm">Featured City (Homepage)</Label>
              <Input
                value={settings.featured_city || ''}
                onChange={(e) => update('featured_city', e.target.value)}
                className="mt-1 bg-[hsl(0,0%,14%)] border-[hsl(0,0%,20%)] text-cream"
              />
            </div>
            <div>
              <Label className="text-cream/70 text-sm">Default Trial Duration (days)</Label>
              <Input
                type="number"
                value={settings.trial_duration_days || '30'}
                onChange={(e) => update('trial_duration_days', e.target.value)}
                className="mt-1 bg-[hsl(0,0%,14%)] border-[hsl(0,0%,20%)] text-cream w-24"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader><CardTitle className="text-cream text-base">Platform Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-cream text-sm">Allow New Registrations</Label>
                <p className="text-xs text-cream/40">When disabled, no new businesses can sign up</p>
              </div>
              <Switch
                checked={settings.allow_new_registrations === 'true'}
                onCheckedChange={(v) => update('allow_new_registrations', String(v))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-cream text-sm">Maintenance Mode</Label>
                <p className="text-xs text-cream/40">Show maintenance page to all visitors</p>
              </div>
              <Switch
                checked={settings.maintenance_mode === 'true'}
                onCheckedChange={(v) => update('maintenance_mode', String(v))}
              />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </AdminLayout>
  );
}
