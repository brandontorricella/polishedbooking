import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useStaffManagement, type StaffWithDetails } from '@/hooks/useStaff';

interface StaffDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffWithDetails;
  businessId: string;
  services: { id: string; name: string; price: number; duration: number }[];
  onSuccess: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StaffDetailModal = ({ open, onOpenChange, staff, businessId, services, onSuccess }: StaffDetailModalProps) => {
  const { updateStaff, deleteStaff, updateStaffServices, updateStaffSchedule } = useStaffManagement(businessId);
  const [name, setName] = useState(staff.name);
  const [title, setTitle] = useState(staff.title || '');
  const [bio, setBio] = useState(staff.bio || '');
  const [email, setEmail] = useState(staff.email || '');
  const [phone, setPhone] = useState(staff.phone || '');
  const [isAccepting, setIsAccepting] = useState(staff.is_accepting_bookings);
  const [commissionType, setCommissionType] = useState(staff.commission_type || 'none');
  const [commissionRate, setCommissionRate] = useState(staff.commission_rate || 0);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    staff.staff_services.map(ss => ss.service_id)
  );
  const [schedule, setSchedule] = useState<Record<number, { start: string; end: string; available: boolean }>>(
    Object.fromEntries(
      staff.staff_schedules.map(s => [s.day_of_week, { start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), available: s.is_available }])
    )
  );
  const [saving, setSaving] = useState(false);

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const toggleDay = (day: number) => {
    setSchedule(prev => {
      const existing = prev[day];
      if (existing) {
        return { ...prev, [day]: { ...existing, available: !existing.available } };
      }
      return { ...prev, [day]: { start: '09:00', end: '17:00', available: true } };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    await updateStaff(staff.id, {
      name: name.trim(),
      title: title.trim() || null,
      bio: bio.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      is_accepting_bookings: isAccepting,
      commission_type: commissionType,
      commission_rate: commissionRate,
    } as any);

    await updateStaffServices(staff.id, selectedServices);

    const scheduleEntries = Object.entries(schedule)
      .filter(([_, v]) => v.available)
      .map(([day, v]) => ({
        day_of_week: parseInt(day),
        start_time: v.start,
        end_time: v.end,
        is_available: true,
      }));
    await updateStaffSchedule(staff.id, scheduleEntries);

    setSaving(false);
    onSuccess();
  };

  const handleDelete = async () => {
    await deleteStaff(staff.id);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Staff Member</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={staff.profile_photo_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Switch checked={isAccepting} onCheckedChange={setIsAccepting} />
                <span className="text-sm">Accepting bookings</span>
              </div>
            </div>
          </div>

          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Senior Stylist" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <Label className="mb-2 block">Services</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedServices.includes(s.id)}
                      onCheckedChange={() => toggleService(s.id)}
                    />
                    <span className="text-sm">{s.name}</span>
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
                <Input type="number" min={0} max={100} step={0.5} value={commissionRate} onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-xs" />
                <span className="text-xs text-muted-foreground">%</span>
                <span className="text-xs text-muted-foreground ml-auto">On $100: ${commissionRate.toFixed(2)}</span>
              </div>
            )}
            {commissionType === 'fixed' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs">$</span>
                <Input type="number" min={0} step={0.5} value={commissionRate} onChange={e => setCommissionRate(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-xs" />
                <span className="text-xs text-muted-foreground">per booking</span>
              </div>
            )}
          </div>

          <div>
            <Label className="mb-2 block">Schedule</Label>
            <div className="space-y-2">
              {DAY_NAMES.map((dayName, i) => {
                const dayData = schedule[i];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Checkbox
                      checked={!!dayData?.available}
                      onCheckedChange={() => toggleDay(i)}
                    />
                    <span className="text-sm w-16">{dayName.slice(0, 3)}</span>
                    {dayData?.available ? (
                      <div className="flex items-center gap-1 flex-1">
                        <Input
                          type="time"
                          className="h-8 text-xs"
                          value={dayData.start}
                          onChange={e => setSchedule(prev => ({ ...prev, [i]: { ...prev[i], start: e.target.value } }))}
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="time"
                          className="h-8 text-xs"
                          value={dayData.end}
                          onChange={e => setSchedule(prev => ({ ...prev, [i]: { ...prev[i], end: e.target.value } }))}
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Off</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {staff.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove them from your active staff. Existing bookings won't be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Deactivate</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gradient-primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
