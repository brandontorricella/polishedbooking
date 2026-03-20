import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Hourglass, Bell, Calendar, Clock, Filter, Send, User, MessageSquare, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusinessWaitlist, type WaitlistEntry } from '@/hooks/useWaitlist';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BusinessWaitlistManagerProps {
  businessId: string;
}

export const BusinessWaitlistManager = ({ businessId }: BusinessWaitlistManagerProps) => {
  const { entries, loading, fetchWaitlist, notifyClient } = useBusinessWaitlist(businessId);
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [serviceFilter, setServiceFilter] = useState('');
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [notifyModal, setNotifyModal] = useState<WaitlistEntry | null>(null);

  useEffect(() => {
    // Fetch services for filter
    const loadServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true);
      setServices((data || []).map(s => ({ id: s.id, name: s.name })));
    };
    loadServices();
  }, [businessId]);

  useEffect(() => {
    fetchWaitlist({
      status: statusFilter,
      service_id: serviceFilter || undefined,
    });
  }, [fetchWaitlist, statusFilter, serviceFilter]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Hourglass className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-display font-bold text-lg">{entries.length} {statusFilter === 'waiting' ? 'waiting' : statusFilter}</p>
          <p className="text-xs text-muted-foreground">People on the waitlist</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="space-y-1 flex-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="w-3 h-3" /> Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs text-muted-foreground">Service</Label>
              <Select value={serviceFilter || 'all'} onValueChange={(v) => setServiceFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <Hourglass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No {statusFilter} entries</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="p-4 bg-card border border-border rounded-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Client info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="font-medium text-sm truncate">{entry.client_name}</p>
                  </div>
                  {entry.client_email && (
                    <p className="text-xs text-muted-foreground truncate ml-6">{entry.client_email}</p>
                  )}
                </div>

                {/* Preferences */}
                <div className="flex flex-wrap gap-1.5">
                  {entry.service_name && (
                    <Badge variant="secondary" className="text-[10px] h-5">{entry.service_name}</Badge>
                  )}
                  {entry.preferred_date && (
                    <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(entry.preferred_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </Badge>
                  )}
                  {entry.preferred_time_start && (
                    <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.preferred_time_start}-{entry.preferred_time_end}
                    </Badge>
                  )}
                  {entry.flexible_dates && (
                    <Badge variant="outline" className="text-[10px] h-5">Flexible</Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  {entry.status === 'waiting' && (
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-primary text-primary-foreground gap-1"
                      onClick={() => setNotifyModal(entry)}
                    >
                      <Bell className="w-3 h-3" /> Notify
                    </Button>
                  )}
                  {entry.status === 'notified' && (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Notified
                    </Badge>
                  )}
                </div>
              </div>

              {entry.notes && (
                <div className="mt-2 ml-6 text-xs text-muted-foreground flex items-start gap-1">
                  <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                  <span>{entry.notes}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Notify Modal */}
      {notifyModal && (
        <NotifyModal
          entry={notifyModal}
          onNotify={async (date, time) => {
            const success = await notifyClient(notifyModal.id, date, time);
            if (success) {
              setNotifyModal(null);
              fetchWaitlist({ status: statusFilter, service_id: serviceFilter || undefined });
            }
          }}
          onClose={() => setNotifyModal(null)}
        />
      )}
    </div>
  );
};

// ─── Notify Modal ───────────────────────────────────────
function NotifyModal({ entry, onNotify, onClose }: {
  entry: WaitlistEntry;
  onNotify: (date: string, time: string) => Promise<void>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(entry.preferred_date || '');
  const [time, setTime] = useState(entry.preferred_time_start || '10:00');
  const [sending, setSending] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  const handleSend = async () => {
    if (!date || !time) return;
    setSending(true);
    await onNotify(date, time);
    setSending(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Notify {entry.client_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Available Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today}
              className="h-9"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Available Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-9"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button
              onClick={handleSend}
              disabled={!date || !time || sending}
              className="flex-1 bg-primary text-primary-foreground gap-1"
            >
              <Send className="w-3.5 h-3.5" /> {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
