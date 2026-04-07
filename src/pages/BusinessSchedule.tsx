import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday } from 'date-fns';
import {
  Calendar, ChevronLeft, ChevronRight, Ban, Clock, User, Scissors, Trash2, Plus, Loader2
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { useBusinessAvailability } from '@/hooks/useBusinessAvailability';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-green-500/10 text-green-700 dark:text-green-400',
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  completed: 'bg-muted text-muted-foreground',
  canceled: 'bg-destructive/10 text-destructive',
};

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${(m || 0).toString().padStart(2, '0')} ${ampm}`;
}

interface ScheduleBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  client_id: string;
  service?: { name: string; duration: number } | null;
  staff?: { name: string } | null;
  client?: { display_name: string | null; email: string } | null;
}

const BusinessSchedulePage = () => {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);

  const { blocks, loading: loadingBlocks, fetchBlocks, createBlock, deleteBlock } = useTimeBlocks(businessId);
  const { availability, loading: loadingHours, saving, fetchAvailability, saveAvailability } = useBusinessAvailability(businessId);
  const [editHours, setEditHours] = useState<Record<number, { is_open: boolean; open_time: string; close_time: string }>>({});

  // Fetch business
  useEffect(() => {
    if (!user) return;
    supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setBusinessId(data.id);
      });
  }, [user]);

  // Fetch staff
  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('staff_members')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .then(({ data }) => setStaffList(data || []));
  }, [businessId]);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    if (!businessId) return;
    setLoadingBookings(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    let query = supabase
      .from('bookings')
      .select(`
        id, booking_date, booking_time, status, total_price, notes, client_id,
        service:services(name, duration),
        staff:staff_members(name)
      `)
      .eq('business_id', businessId)
      .eq('booking_date', dateStr)
      .in('status', ['confirmed', 'pending', 'completed'])
      .order('booking_time', { ascending: true });

    if (selectedStaff !== 'all') {
      query = query.eq('staff_id', selectedStaff);
    }

    const { data } = await query;
    const mapped = (data || []).map((b: any) => ({
      ...b,
      service: Array.isArray(b.service) ? b.service[0] : b.service,
      staff: Array.isArray(b.staff) ? b.staff[0] : b.staff,
    }));

    // Fetch client profiles
    const clientIds = [...new Set(mapped.map((b: any) => b.client_id))];
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', clientIds);
      const pMap = new Map((profiles || []).map(p => [p.user_id, p]));
      mapped.forEach((b: any) => { b.client = pMap.get(b.client_id) || null; });
    }

    setBookings(mapped);
    setLoadingBookings(false);

    // Also fetch blocks for this date
    fetchBlocks(dateStr, selectedStaff !== 'all' ? selectedStaff : undefined);
  }, [businessId, selectedDate, selectedStaff, fetchBlocks]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Hours modal
  useEffect(() => {
    if (showHoursModal && businessId) {
      fetchAvailability();
    }
  }, [showHoursModal, businessId, fetchAvailability]);

  useEffect(() => {
    if (Object.keys(availability).length > 0) {
      const h: Record<number, { is_open: boolean; open_time: string; close_time: string }> = {};
      for (let i = 0; i < 7; i++) {
        h[i] = {
          is_open: availability[i]?.is_open ?? (i !== 0 && i !== 6),
          open_time: availability[i]?.open_time || '09:00',
          close_time: availability[i]?.close_time || '18:00',
        };
      }
      setEditHours(h);
    }
  }, [availability]);

  const handleDeleteBlock = async (id: string) => {
    const ok = await deleteBlock(id);
    if (ok) fetchSchedule();
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const isLoading = loadingBookings || loadingBlocks;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Calendar className="w-7 h-7 text-primary" /> Schedule
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage bookings, block times, and set your hours</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowHoursModal(true)}>
                <Clock className="w-4 h-4 mr-1" /> Business Hours
              </Button>
              <Button size="sm" className="bg-gradient-primary" onClick={() => setShowBlockModal(true)}>
                <Ban className="w-4 h-4 mr-1" /> Block Time
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, -1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <span className="font-medium min-w-[200px] text-center">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(startOfToday())}>
                Today
              </Button>
            </div>
          </div>

          {/* Schedule Content */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : bookings.length === 0 && blocks.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No appointments or blocks on this day</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowBlockModal(true)}>
                Block time for external appointments
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Bookings */}
              {bookings.map(booking => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 text-center min-w-[60px]">
                      <div className="text-sm font-bold text-primary">{formatTime(booking.booking_time)}</div>
                      {booking.service && <div className="text-[11px] text-muted-foreground">{booking.service.duration} min</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.client?.display_name || booking.client?.email?.split('@')[0] || 'Client'}
                      </p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-1">
                        {booking.service && (
                          <Badge variant="secondary" className="text-xs">
                            <Scissors className="w-3 h-3 mr-0.5" /> {booking.service.name}
                          </Badge>
                        )}
                        {booking.staff && (
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-0.5" /> {booking.staff.name}
                          </Badge>
                        )}
                        <Badge className={cn('text-xs', statusStyles[booking.status || 'pending'])}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                    <span className="font-bold text-sm shrink-0">${booking.total_price}</span>
                  </div>
                </Card>
              ))}

              {/* Time Blocks */}
              {blocks.map(block => (
                <Card key={block.id} className="p-4 border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 text-center min-w-[60px]">
                      <div className="text-sm font-bold text-destructive">
                        {block.is_all_day ? 'All Day' : formatTime(block.start_time)}
                      </div>
                      {!block.is_all_day && (
                        <div className="text-[11px] text-muted-foreground">to {formatTime(block.end_time)}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5 text-destructive" /> Blocked
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {block.reason && (
                          <span className="text-xs text-muted-foreground capitalize">{block.reason.replace(/_/g, ' ')}</span>
                        )}
                        {block.staff && (
                          <Badge variant="outline" className="text-xs">{block.staff.name}</Badge>
                        )}
                      </div>
                      {block.notes && <p className="text-xs text-muted-foreground mt-1 italic">{block.notes}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => handleDeleteBlock(block.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Day Summary */}
              <div className="flex items-center justify-between px-2 pt-2 border-t border-border text-sm">
                <span className="text-muted-foreground">
                  {bookings.length} appointment{bookings.length !== 1 ? 's' : ''}, {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                </span>
                <span className="font-semibold">
                  Total: ${bookings.reduce((sum, b) => sum + Number(b.total_price), 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Add Time Block Modal */}
      <AddBlockModal
        open={showBlockModal}
        onOpenChange={setShowBlockModal}
        staff={staffList}
        defaultDate={selectedDate}
        onSaved={() => { setShowBlockModal(false); fetchSchedule(); }}
        createBlock={createBlock}
      />

      {/* Business Hours Modal */}
      <Dialog open={showHoursModal} onOpenChange={setShowHoursModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Business Hours
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Control when customers can book online. Use the Schedule page to block specific times.
          </p>
          {loadingHours ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {dayNames.map((day, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Switch
                    checked={editHours[i]?.is_open ?? false}
                    onCheckedChange={v => setEditHours(h => ({ ...h, [i]: { ...h[i], is_open: v } }))}
                  />
                  <span className="w-24 text-sm font-medium">{day}</span>
                  {editHours[i]?.is_open ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="time"
                        value={editHours[i]?.open_time || '09:00'}
                        onChange={e => setEditHours(h => ({ ...h, [i]: { ...h[i], open_time: e.target.value } }))}
                        className="h-8 w-28"
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={editHours[i]?.close_time || '18:00'}
                        onChange={e => setEditHours(h => ({ ...h, [i]: { ...h[i], close_time: e.target.value } }))}
                        className="h-8 w-28"
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoursModal(false)}>Cancel</Button>
            <Button
              className="bg-gradient-primary"
              disabled={saving}
              onClick={async () => {
                const mapped: Record<number, any> = {};
                for (let i = 0; i < 7; i++) {
                  mapped[i] = {
                    day_of_week: i,
                    is_open: editHours[i]?.is_open ?? false,
                    open_time: editHours[i]?.open_time || '09:00',
                    close_time: editHours[i]?.close_time || '18:00',
                  };
                }
                const ok = await saveAvailability(mapped);
                if (ok) setShowHoursModal(false);
              }}
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : 'Save Hours'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add Block Modal
function AddBlockModal({ open, onOpenChange, staff, defaultDate, onSaved, createBlock }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  staff: { id: string; name: string }[];
  defaultDate: Date;
  onSaved: () => void;
  createBlock: (b: any) => Promise<boolean>;
}) {
  const [form, setForm] = useState({
    staff_id: '',
    block_date: format(defaultDate, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    is_all_day: false,
    reason: 'booked_externally',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(f => ({ ...f, block_date: format(defaultDate, 'yyyy-MM-dd') }));
  }, [defaultDate]);

  const handleSave = async () => {
    if (!form.is_all_day && form.end_time <= form.start_time) {
      setError('End time must be after start time');
      return;
    }
    setSaving(true);
    setError('');
    const ok = await createBlock(form);
    setSaving(false);
    if (ok) onSaved();
    else setError('Failed to create block');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-destructive" /> Block Time
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Blocked times prevent customers from booking online. Use for external appointments, vacations, lunch, or personal time.
        </p>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Block For</Label>
            <Select value={form.staff_id || '__business__'} onValueChange={v => setForm(f => ({ ...f, staff_id: v === '__business__' ? '' : v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__business__">Entire Business</SelectItem>
                {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name} only</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Date</Label>
            <Input type="date" value={form.block_date} onChange={e => setForm(f => ({ ...f, block_date: e.target.value }))} className="mt-1" />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={form.is_all_day} onCheckedChange={v => setForm(f => ({ ...f, is_all_day: v }))} />
            <Label className="text-sm">All Day</Label>
          </div>

          {!form.is_all_day && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Start</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-sm">End</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} className="mt-1" />
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm">Reason</Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="booked_externally">Booked Outside Polished</SelectItem>
                <SelectItem value="vacation">Vacation / Time Off</SelectItem>
                <SelectItem value="lunch">Lunch Break</SelectItem>
                <SelectItem value="personal">Personal Appointment</SelectItem>
                <SelectItem value="training">Training / Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm">Notes (optional)</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Walk-in client" className="mt-1" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-gradient-primary" disabled={saving} onClick={handleSave}>
            {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...</> : 'Block This Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BusinessSchedulePage;
