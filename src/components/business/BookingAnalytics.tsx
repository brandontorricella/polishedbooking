import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, CheckCircle, XCircle, AlertTriangle, DollarSign,
  Users, Clock, Filter, TrendingUp, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface BookingAnalyticsProps {
  businessId: string;
}

interface BookingSummary {
  total: number;
  completed: number;
  canceled: number;
  pending: number;
  completionRate: number;
  cancellationRate: number;
  avgBookingValue: number;
}

interface ServiceBreakdown {
  name: string;
  count: number;
  revenue: number;
}

interface StaffBreakdown {
  name: string;
  count: number;
  revenue: number;
}

interface DailyBooking {
  date: string;
  label: string;
  count: number;
}

const COLORS = ['hsl(330 80% 60%)', 'hsl(200 80% 55%)', 'hsl(150 60% 45%)', 'hsl(40 90% 55%)', 'hsl(270 60% 60%)', 'hsl(10 80% 55%)'];

const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 sm:p-5 bg-card rounded-2xl border border-border"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-display font-bold mt-1">{value}</p>
      </div>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color || "bg-primary/10 text-primary")}>
        {icon}
      </div>
    </div>
  </motion.div>
);

export const BookingAnalytics = ({ businessId }: BookingAnalyticsProps) => {
  const [dateRange, setDateRange] = useState('30');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<BookingSummary>({ total: 0, completed: 0, canceled: 0, pending: 0, completionRate: 0, cancellationRate: 0, avgBookingValue: 0 });
  const [dailyBookings, setDailyBookings] = useState<DailyBooking[]>([]);
  const [byService, setByService] = useState<ServiceBreakdown[]>([]);
  const [byStaff, setByStaff] = useState<StaffBreakdown[]>([]);
  const [byDayOfWeek, setByDayOfWeek] = useState<{ name: string; count: number }[]>([]);
  const [byHour, setByHour] = useState<{ name: string; count: number }[]>([]);
  const [newVsReturning, setNewVsReturning] = useState<{ name: string; value: number }[]>([]);

  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);

  const fetchFilters = useCallback(async () => {
    const [svcRes, staffRes] = await Promise.all([
      supabase.from('services').select('id, name').eq('business_id', businessId).eq('is_active', true),
      supabase.from('staff_members').select('id, name').eq('business_id', businessId).eq('is_active', true),
    ]);
    setServices(svcRes.data || []);
    setStaff(staffRes.data || []);
  }, [businessId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    let query = supabase
      .from('bookings')
      .select('id, booking_date, booking_time, status, total_price, service_id, staff_id, client_id')
      .eq('business_id', businessId)
      .gte('booking_date', startStr)
      .lte('booking_date', endStr);

    if (serviceFilter !== 'all') query = query.eq('service_id', serviceFilter);
    if (staffFilter !== 'all') query = query.eq('staff_id', staffFilter);

    const { data: bookings } = await query;
    const rows = bookings || [];

    // Summary
    const completed = rows.filter(b => b.status === 'completed');
    const canceled = rows.filter(b => b.status === 'canceled');
    const pending = rows.filter(b => b.status === 'pending' || b.status === 'confirmed');
    const totalRev = completed.reduce((s, b) => s + Number(b.total_price || 0), 0);

    setSummary({
      total: rows.length,
      completed: completed.length,
      canceled: canceled.length,
      pending: pending.length,
      completionRate: rows.length > 0 ? Math.round((completed.length / rows.length) * 100 * 10) / 10 : 0,
      cancellationRate: rows.length > 0 ? Math.round((canceled.length / rows.length) * 100 * 10) / 10 : 0,
      avgBookingValue: completed.length > 0 ? Math.round((totalRev / completed.length) * 100) / 100 : 0,
    });

    // Daily bookings
    const dailyMap: Record<string, number> = {};
    rows.forEach(b => {
      dailyMap[b.booking_date] = (dailyMap[b.booking_date] || 0) + 1;
    });
    setDailyBookings(
      Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          date,
          label: new Date(date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          count,
        }))
    );

    // By service
    const svcMap: Record<string, { count: number; revenue: number }> = {};
    completed.forEach(b => {
      if (!svcMap[b.service_id]) svcMap[b.service_id] = { count: 0, revenue: 0 };
      svcMap[b.service_id].count++;
      svcMap[b.service_id].revenue += Number(b.total_price || 0);
    });
    const svcNames = services.reduce((m, s) => ({ ...m, [s.id]: s.name }), {} as Record<string, string>);
    setByService(
      Object.entries(svcMap)
        .map(([id, val]) => ({ name: svcNames[id] || 'Unknown', ...val }))
        .sort((a, b) => b.count - a.count)
    );

    // By staff
    const staffMap: Record<string, { count: number; revenue: number }> = {};
    completed.filter(b => b.staff_id).forEach(b => {
      if (!staffMap[b.staff_id!]) staffMap[b.staff_id!] = { count: 0, revenue: 0 };
      staffMap[b.staff_id!].count++;
      staffMap[b.staff_id!].revenue += Number(b.total_price || 0);
    });
    const staffNames = staff.reduce((m, s) => ({ ...m, [s.id]: s.name }), {} as Record<string, string>);
    setByStaff(
      Object.entries(staffMap)
        .map(([id, val]) => ({ name: staffNames[id] || 'Unassigned', ...val }))
        .sort((a, b) => b.count - a.count)
    );

    // By day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowMap: number[] = [0, 0, 0, 0, 0, 0, 0];
    completed.forEach(b => {
      const dow = new Date(b.booking_date).getDay();
      dowMap[dow]++;
    });
    setByDayOfWeek(dayNames.map((name, i) => ({ name, count: dowMap[i] })));

    // By hour
    const hourMap: Record<number, number> = {};
    completed.forEach(b => {
      const hour = parseInt(b.booking_time.split(':')[0]);
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    setByHour(
      Object.entries(hourMap)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([h, count]) => ({
          name: `${Number(h) > 12 ? Number(h) - 12 : Number(h)}${Number(h) >= 12 ? 'pm' : 'am'}`,
          count,
        }))
    );

    // New vs returning
    const clientFirstBooking: Record<string, string> = {};
    // Get all bookings for this business to find first booking per client
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('client_id, booking_date')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .order('booking_date', { ascending: true });

    (allBookings || []).forEach(b => {
      if (!clientFirstBooking[b.client_id]) clientFirstBooking[b.client_id] = b.booking_date;
    });

    let newCount = 0;
    let returningCount = 0;
    completed.forEach(b => {
      if (clientFirstBooking[b.client_id] === b.booking_date) newCount++;
      else returningCount++;
    });
    setNewVsReturning([
      { name: 'New Clients', value: newCount },
      { name: 'Returning', value: returningCount },
    ]);

    setLoading(false);
  }, [businessId, dateRange, serviceFilter, staffFilter, services, staff]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    if (services.length >= 0) fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date Range
              </Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Service
              </Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-[140px]">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Staff
              </Label>
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Total Bookings" value={summary.total} icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Completed" value={summary.completed} icon={<CheckCircle className="w-5 h-5" />} color="bg-green-500/10 text-green-600" />
        <StatCard title="Canceled" value={summary.canceled} icon={<XCircle className="w-5 h-5" />} color="bg-destructive/10 text-destructive" />
        <StatCard title="Completion Rate" value={`${summary.completionRate}%`} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard title="Cancellation Rate" value={`${summary.cancellationRate}%`} icon={<AlertTriangle className="w-5 h-5" />} color="bg-amber-500/10 text-amber-600" />
        <StatCard title="Avg Booking Value" value={`$${summary.avgBookingValue.toFixed(2)}`} icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* Bookings Over Time */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Bookings Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 sm:h-64">
            {dailyBookings.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No bookings in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyBookings}>
                  <defs>
                    <linearGradient id="bookingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(330 80% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(330 80% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="count" name="Bookings" stroke="hsl(330 80% 60%)" strokeWidth={2} fill="url(#bookingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* By Service & Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Bookings by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {byService.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
            ) : (
              <div className="space-y-2">
                {byService.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-bold text-primary w-6">#{i + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.count} bookings</span>
                    <span className="text-sm font-semibold">${item.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Bookings by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {byStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
            ) : (
              <div className="space-y-2">
                {byStaff.slice(0, 8).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-bold text-primary w-6">#{i + 1}</span>
                    <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground">{item.count} bookings</span>
                    <span className="text-sm font-semibold">${item.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day of Week & Hour Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> By Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" name="Bookings" fill="hsl(330 80% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> By Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {byHour.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="count" name="Bookings" fill="hsl(200 80% 55%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New vs Returning */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> New vs Returning Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-48 w-48">
              {newVsReturning.every(d => d.value === 0) ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={newVsReturning}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {newVsReturning.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex gap-6">
              {newVsReturning.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[i] }} />
                  <p className="text-2xl font-display font-bold">{d.value}</p>
                  <p className="text-xs text-muted-foreground">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
