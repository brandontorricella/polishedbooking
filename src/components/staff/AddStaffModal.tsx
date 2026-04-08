import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useStaffManagement } from '@/hooks/useStaff';

interface AddStaffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  services: { id: string; name: string; price: number; duration: number }[];
  onSuccess: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AddStaffModal = ({ open, onOpenChange, businessId, services, onSuccess }: AddStaffModalProps) => {
  const { addStaff } = useStaffManagement(businessId);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionType, setCommissionType] = useState('none');
  const [commissionRate, setCommissionRate] = useState(0);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    // Default schedule: Mon-Fri 9-5
    const defaultSchedule = [1, 2, 3, 4, 5].map(day => ({
      day_of_week: day,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    }));

    const success = await addStaff({
      name: name.trim(),
      title: title.trim() || undefined,
      bio: bio.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      commissionType,
      commissionRate,
      serviceIds: selectedServices,
      schedule: defaultSchedule,
    });

    setSaving(false);
    if (success) {
      setName(''); setTitle(''); setBio(''); setEmail(''); setPhone('');
      setSelectedServices([]);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add Staff Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Senior Stylist" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="About this team member..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <Label className="mb-2 block">Services Offered</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedServices.includes(s.id)}
                      onCheckedChange={() => toggleService(s.id)}
                    />
                    <span className="text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">${s.price}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Commission Settings */}
          <div>
            <Label className="mb-2 block">Commission</Label>
            <select value={commissionType} onChange={e => setCommissionType(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="none">No Commission</option>
              <option value="percentage">Percentage of service price</option>
              <option value="fixed">Fixed amount per booking</option>
            </select>
            {commissionType === 'percentage' && (
              <div className="flex items-center gap-2 mt-2">
                <Input type="number" min={0} max={100} step={0.5} value={commissionRate} onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24" />
                <span className="text-sm text-muted-foreground">%</span>
                <span className="text-xs text-muted-foreground ml-auto">On $100: ${commissionRate.toFixed(2)}</span>
              </div>
            )}
            {commissionType === 'fixed' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">$</span>
                <Input type="number" min={0} step={0.5} value={commissionRate} onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24" />
                <span className="text-sm text-muted-foreground">per booking</span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Default schedule (Mon-Fri 9AM-5PM) will be applied. You can edit it after.</p>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : 'Add Staff'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
