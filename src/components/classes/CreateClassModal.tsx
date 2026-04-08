import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useClasses, ClassSchedule } from '@/hooks/useClasses';
import { useStaffList } from '@/hooks/useStaff';
import { useAccountType } from '@/hooks/useAccountType';

const CLASS_CATEGORIES = [
  'Yoga', 'Pilates', 'HIIT', 'Strength Training', 'Dance Fitness',
  'Meditation', 'Barre', 'Spinning', 'Functional Fitness', 'Stretching',
  'Prenatal Fitness', 'Postpartum Fitness', 'Senior Fitness', 'Other'
];

interface Props {
  schedule: ClassSchedule | null;
  onClose: () => void;
}

export const CreateClassModal = ({ schedule: existing, onClose }: Props) => {
  const { createSchedule, updateSchedule } = useClasses();
  const { businessId } = useAccountType();
  const { staff } = useStaffList(businessId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    instructor_id: existing?.instructor_id || '',
    duration_minutes: existing?.duration_minutes || 60,
    capacity: existing?.capacity || 10,
    price: existing?.price || 0,
    is_free: existing?.is_free || false,
    is_virtual: existing?.is_virtual || false,
    virtual_link: existing?.virtual_link || '',
    category: existing?.category || '',
    image_url: existing?.image_url || '',
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (form.capacity < 2) return;
    setSaving(true);
    const success = existing
      ? await updateSchedule(existing.id, form as any)
      : await createSchedule(form as any);
    setSaving(false);
    if (success) onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Class' : '👥 Create Class'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Class Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Morning Vinyasa Flow" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will clients experience?" rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CLASS_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instructor</Label>
              <Select value={form.instructor_id} onValueChange={v => setForm({ ...form, instructor_id: v })}>
                <SelectTrigger><SelectValue placeholder="No instructor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" min={15} max={300} value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} />
            </div>
            <div className="space-y-2">
              <Label>Max Capacity</Label>
              <Input type="number" min={2} max={500} value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 10 })} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><p className="text-sm font-medium">Free Class</p><p className="text-xs text-muted-foreground">No charge for enrollment</p></div>
            <Switch checked={form.is_free} onCheckedChange={v => setForm({ ...form, is_free: v, price: v ? 0 : form.price })} />
          </div>

          {!form.is_free && (
            <div className="space-y-2">
              <Label>Class Price ($)</Label>
              <Input type="number" min={0} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><p className="text-sm font-medium">Virtual / Online Class</p><p className="text-xs text-muted-foreground">Conducted via video call</p></div>
            <Switch checked={form.is_virtual} onCheckedChange={v => setForm({ ...form, is_virtual: v })} />
          </div>

          {form.is_virtual && (
            <div className="space-y-2">
              <Label>Video Meeting Link</Label>
              <Input type="url" value={form.virtual_link} onChange={e => setForm({ ...form, virtual_link: e.target.value })} placeholder="https://zoom.us/j/..." />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : existing ? 'Save Changes' : 'Create Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
