import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useClasses, ClassSchedule } from '@/hooks/useClasses';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  schedule: ClassSchedule;
  onClose: () => void;
}

export const AddSessionsModal = ({ schedule, onClose }: Props) => {
  const { createBulkSessions, fetchSessions } = useClasses();
  const [mode, setMode] = useState<'single' | 'recurring'>('single');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    days_of_week: [] as number[],
    weeks_count: 4,
  });

  const toggleDay = (day: number) => {
    setForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const count = await createBulkSessions(
      schedule.id, mode, form.start_date, form.start_time, form.days_of_week, form.weeks_count
    );
    setSaving(false);
    if (count > 0) {
      await fetchSessions();
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📅 Schedule Sessions — {schedule.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={mode} onValueChange={v => setMode(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="single" className="flex-1">Single Session</TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1">Recurring</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{mode === 'single' ? 'Date' : 'Start Date'}</Label>
            <Input type="date" value={form.start_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm({ ...form, start_date: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} />
          </div>

          {mode === 'recurring' && (
            <>
              <div className="space-y-2">
                <Label>Repeat on these days</Label>
                <div className="flex gap-1.5">
                  {DAY_NAMES.map((day, i) => (
                    <Button
                      key={i}
                      type="button"
                      size="sm"
                      variant={form.days_of_week.includes(i) ? 'default' : 'outline'}
                      className="h-9 w-10 p-0 text-xs"
                      onClick={() => toggleDay(i)}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>For how many weeks?</Label>
                <Select value={String(form.weeks_count)} onValueChange={v => setForm({ ...form, weeks_count: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 4, 6, 8, 12, 16, 24, 52].map(w => (
                      <SelectItem key={w} value={String(w)}>{w} weeks</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scheduling...</> : `Schedule Session${mode === 'recurring' ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
