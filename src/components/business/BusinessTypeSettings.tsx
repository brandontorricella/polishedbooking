import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccountType } from '@/hooks/useAccountType';

const CREDENTIAL_SUGGESTIONS = [
  'Licensed Cosmetologist', 'Licensed Esthetician', 'Licensed Massage Therapist',
  'RYT-200 (Registered Yoga Teacher)', 'RYT-500', 'NASM Certified Personal Trainer',
  'ACE Certified Trainer', 'Pilates Instructor (PMA)', 'Licensed Acupuncturist',
  'Board Certified Nutritionist', 'Certified Health Coach (IIN)',
  'Licensed Professional Counselor', 'Certified Life Coach',
  'Reiki Master', 'Ayurvedic Practitioner', 'Licensed Chiropractor',
  'Certified Prenatal Yoga Instructor', 'Postpartum Doula'
];

export function BusinessTypeSettings() {
  const { businessId } = useAccountType();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [offersAppointments, setOffersAppointments] = useState(true);
  const [offersClasses, setOffersClasses] = useState(false);
  const [offersVirtual, setOffersVirtual] = useState(false);
  const [defaultVirtualLink, setDefaultVirtualLink] = useState('');
  const [credentials, setCredentials] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [credInput, setCredInput] = useState('');
  const [specInput, setSpecInput] = useState('');

  useEffect(() => {
    if (!businessId) return;
    const load = async () => {
      const { data } = await supabase.from('businesses').select('offers_appointments, offers_classes, offers_virtual, default_virtual_link, credentials, specialties').eq('id', businessId).single();
      if (data) {
        setOffersAppointments(data.offers_appointments ?? true);
        setOffersClasses(data.offers_classes ?? false);
        setOffersVirtual(data.offers_virtual ?? false);
        setDefaultVirtualLink(data.default_virtual_link || '');
        setCredentials(data.credentials || []);
        setSpecialties(data.specialties || []);
      }
    };
    load();
  }, [businessId]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    const { error } = await supabase.from('businesses').update({
      offers_appointments: offersAppointments,
      offers_classes: offersClasses,
      offers_virtual: offersVirtual,
      default_virtual_link: offersVirtual ? defaultVirtualLink : null,
      credentials,
      specialties,
    }).eq('id', businessId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Settings saved', description: 'Your business type and credentials have been updated.' });
    }
    setSaving(false);
  };

  const addCredential = () => {
    if (!credInput.trim()) return;
    setCredentials(prev => [...prev, credInput.trim()]);
    setCredInput('');
  };

  const addSpecialty = () => {
    if (!specInput.trim()) return;
    setSpecialties(prev => [...prev, specInput.trim()]);
    setSpecInput('');
  };

  return (
    <div className="space-y-6">
      {/* Business Type */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold">How You Work With Clients</h3>
          <p className="text-sm text-muted-foreground">This helps clients understand what to expect when booking with you.</p>
        </div>

        {[
          { label: '1-on-1 Appointments', desc: 'Individual sessions booked by one client at a time', checked: offersAppointments, onChange: setOffersAppointments },
          { label: 'Group Classes', desc: 'Multiple clients join the same session (yoga, pilates, etc.)', checked: offersClasses, onChange: setOffersClasses },
          { label: 'Virtual / Online Sessions', desc: 'Sessions via Zoom, Google Meet, or other video platform', checked: offersVirtual, onChange: setOffersVirtual },
        ].map(opt => (
          <div key={opt.label} className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
            <Switch checked={opt.checked} onCheckedChange={opt.onChange} />
          </div>
        ))}

        {offersVirtual && (
          <div className="pt-2">
            <Label className="text-sm">Default Video Meeting Link</Label>
            <p className="text-xs text-muted-foreground mb-2">Can be overridden per service.</p>
            <Input
              type="url"
              value={defaultVirtualLink}
              onChange={e => setDefaultVirtualLink(e.target.value)}
              placeholder="https://zoom.us/j/your-meeting-id"
              className="h-10"
            />
          </div>
        )}
      </div>

      {/* Credentials */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold">Credentials & Specialties</h3>
          <p className="text-sm text-muted-foreground">Showcase your qualifications to build trust with potential clients.</p>
        </div>

        <div>
          <Label className="text-sm">Licenses & Certifications</Label>
          <div className="flex flex-wrap gap-2 my-2 min-h-[32px]">
            {credentials.map((cred, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary/10 border border-primary/30 text-foreground">
                🏆 {cred}
                <button onClick={() => setCredentials(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={credInput}
              onChange={e => setCredInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCredential())}
              placeholder="e.g. Licensed Cosmetologist"
              list="cred-suggestions-settings"
              className="h-10 flex-1"
            />
            <Button type="button" size="sm" onClick={addCredential} className="h-10 bg-primary hover:bg-primary/90">+ Add</Button>
          </div>
          <datalist id="cred-suggestions-settings">
            {CREDENTIAL_SUGGESTIONS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>

        <div>
          <Label className="text-sm">Specialties</Label>
          <div className="flex flex-wrap gap-2 my-2 min-h-[32px]">
            {specialties.map((spec, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-blue-500/10 border border-blue-500/30 text-foreground">
                ⭐ {spec}
                <button onClick={() => setSpecialties(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={specInput}
              onChange={e => setSpecInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              placeholder="e.g. Balayage, Deep Tissue, Prenatal Yoga"
              className="h-10 flex-1"
            />
            <Button type="button" size="sm" onClick={addSpecialty} className="h-10 bg-primary hover:bg-primary/90">+ Add</Button>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-gradient-primary hover:opacity-90">
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}
