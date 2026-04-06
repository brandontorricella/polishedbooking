import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Calendar, ArrowUp, ArrowDown, Users, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RevenueAnalyticsProps {
  businessId: string;
}

interface RevenueSummary {
  totalRevenue: number;
  totalBookings: number;
  avgOrderValue: number;
  dailyAverage: number;
  projectedMonthly: number;
  projectedYearly: number;
}

interface Comparison {
  revenueChange: number;
  bookingsChange: number;
  prevRevenue: number;
}

interface TopClient {
  clientId: string;
  displayName: string;
  totalSpent: number;
  visits: number;
}

const StatCard = ({ title, value, subtitle, change, large }: {
  title: string; value: string; subtitle?: string; change?: number; large?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "p-4 sm:p-5 rounded-2xl border",
      large
        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-primary/20"
        : "bg-card border-border"
    )}
  >
    <p className={cn("text-xs sm:text-sm truncate", large ? "text-primary-foreground/80" : "text-muted-foreground")}>{title}</p>
    <p className="text-xl sm:text-2xl font-display font-bold mt-1">{value}</p>
    {typeof change === 'number' && (
      <div className={cn(
        "flex items-center gap-1 mt-1.5 text-xs sm:text-sm",
        large ? "text-primary-foreground/90" : (change >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")
      )}>
        {change >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
        <span>{Math.abs(change)}% vs prev</span>
      </div>
    )}
    {subtitle && <p className={cn("text-xs mt-1", large ? "text-primary-foreground/70" : "text-muted-foreground")}>{subtitle}</p>}
  </motion.div>
);

export const RevenueAnalytics = ({ businessId }: RevenueAnalyticsProps) => {
  const [dateRange, setDateRange] = useState('30');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState<RevenueSummary>({ totalRevenue: 0, totalBookings: 0, avgOrderValue: 0, dailyAverage: 0, projectedMonthly: 0, projectedYearly: 0 });
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [dailyRevenue, setDailyRevenue] = useState<{ label: string; revenue: number }[]>([]);
  const [byService, setByService] = useState<{ name: string; revenue: number; count: number }[]>([]);
  const [byStaff, setByStaff] = useState<{ name: string; revenue: number; count: number }[]>([]);
  const [byDayOfWeek, setByDayOfWeek] = useState<{ name: string; revenue: number }[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const days = Math.max(1, parseInt(dateRange));

    // Get completed bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_date, total_price, service_id, staff_id, client_id, status')
      .eq('business_id', businessId)
      .gte('booking_date', startStr)
      .lte('booking_date', endStr)
      .eq('status', 'completed');

    const rows = bookings || [];
    const totalRev = rows.reduce((s, b) => s + Number(b.total_price || 0), 0);
    const dailyAvg = totalRev / days;

    setSummary({
      totalRevenue: totalRev,
      totalBookings: rows.length,
      avgOrderValue: rows.length > 0 ? totalRev / rows.length : 0,
      dailyAverage: dailyAvg,
      projectedMonthly: dailyAvg * 30,
      projectedYearly: dailyAvg * 365,
    });

    // Comparison
    if (compareEnabled) {
      const prevEnd = new Date(start.getTime() - 86400000);
      const prevStart = new Date(prevEnd.getTime() - (end.getTime() - start.getTime()));
      const { data: prevBookings } = await supabase
        .from('bookings')
        .select('total_price')
        .eq('business_id', businessId)
        .gte('booking_date', prevStart.toISOString().split('T')[0])
        .lte('booking_date', prevEnd.toISOString().split('T')[0])
        .eq('status', 'completed');

      const prevRows = prevBookings || [];
      const prevRev = prevRows.reduce((s, b) => s + Number(b.total_price || 0), 0);
      const revChange = prevRev > 0 ? Math.round(((totalRev - prevRev) / prevRev) * 100 * 10) / 10 : (totalRev > 0 ? 100 : 0);
      const bkgChange = prevRows.length > 0 ? Math.round(((rows.length - prevRows.length) / prevRows.length) * 100 * 10) / 10 : (rows.length > 0 ? 100 : 0);
      setComparison({ revenueChange: revChange, bookingsChange: bkgChange, prevRevenue: prevRev });
    } else {
      setComparison(null);
    }

    // Daily revenue
    const dailyMap: Record<string, number> = {};
    rows.forEach(b => {
      dailyMap[b.booking_date] = (dailyMap[b.booking_date] || 0) + Number(b.total_price || 0);
    });
    setDailyRevenue(
      Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, revenue]) => ({
          label: new Date(date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          revenue: Math.round(revenue * 100) / 100,
        }))
    );

    // By service
    const [svcRes] = await Promise.all([
      supabase.from('services').select('id, name').eq('business_id', businessId),
    ]);
    const svcNames = (svcRes.data || []).reduce((m, s) => ({ ...m, [s.id]: s.name }), {} as Record<string, string>);
    const svcMap: Record<string, { revenue: number; count: number }> = {};
    rows.forEach(b => {
      if (!svcMap[b.service_id]) svcMap[b.service_id] = { revenue: 0, count: 0 };
      svcMap[b.service_id].revenue += Number(b.total_price || 0);
      svcMap[b.service_id].count++;
    });
    setByService(
      Object.entries(svcMap)
        .map(([id, val]) => ({ name: svcNames[id] || 'Unknown', ...val }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    // By staff
    const staffRes = await supabase.from('staff_members').select('id, name').eq('business_id', businessId);
    const staffNames = (staffRes.data || []).reduce((m, s) => ({ ...m, [s.id]: s.name }), {} as Record<string, string>);
    const staffMap: Record<string, { revenue: number; count: number }> = {};
    rows.filter(b => b.staff_id).forEach(b => {
      if (!staffMap[b.staff_id!]) staffMap[b.staff_id!] = { revenue: 0, count: 0 };
      staffMap[b.staff_id!].revenue += Number(b.total_price || 0);
      staffMap[b.staff_id!].count++;
    });
    setByStaff(
      Object.entries(staffMap)
        .map(([id, val]) => ({ name: staffNames[id] || 'Unassigned', ...val }))
        .sort((a, b) => b.revenue - a.revenue)
    );

    // By day of week
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dowMap: number[] = [0, 0, 0, 0, 0, 0, 0];
    rows.forEach(b => {
      const dow = new Date(b.booking_date).getDay();
      dowMap[dow] += Number(b.total_price || 0);
    });
    setByDayOfWeek(dayNames.map((name, i) => ({ name, revenue: Math.round(dowMap[i] * 100) / 100 })));

    // Top clients
    const clientMap: Record<string, { totalSpent: number; visits: number }> = {};
    rows.forEach(b => {
      if (!clientMap[b.client_id]) clientMap[b.client_id] = { totalSpent: 0, visits: 0 };
      clientMap[b.client_id].totalSpent += Number(b.total_price || 0);
      clientMap[b.client_id].visits++;
    });

    const clientIds = Object.keys(clientMap);
    let profileMap: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', clientIds.slice(0, 50));
      (profiles || []).forEach(p => {
        profileMap[p.user_id] = p.display_name || p.email || 'Unknown';
      });
    }

    setTopClients(
      Object.entries(clientMap)
        .sort(([, a], [, b]) => b.totalSpent - a.totalSpent)
        .slice(0, 10)
        .map(([clientId, val]) => ({
          clientId,
          displayName: profileMap[clientId] || 'Client',
          ...val,
        }))
    );

    setLoading(false);
  }, [businessId, dateRange, compareEnabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
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
            <div className="flex items-center gap-2 pb-0.5">
              <Switch id="rev-compare" checked={compareEnabled} onCheckedChange={setCompareEnabled} />
              <Label htmlFor="rev-compare" className="text-xs sm:text-sm cursor-pointer">Compare previous</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={comparison?.revenueChange}
          large
        />
        <StatCard title="Avg Order Value" value={`$${summary.avgOrderValue.toFixed(2)}`} />
        <StatCard title="Daily Average" value={`$${summary.dailyAverage.toFixed(2)}`} />
        <StatCard title="Projected Monthly" value={`$${Math.round(summary.projectedMonthly).toLocaleString()}`} subtitle="Based on current pace" />
      </div>

      {/* Revenue Over Time */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Revenue Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 sm:h-64">
            {dailyRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No revenue data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(150 60% 45%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(150 60% 45%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickFormatter={(v) => `$${Math.round(v)}`} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(150 60% 45%)" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Service & Staff */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            {byService.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byService.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="hsl(330 80% 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Revenue by Staff</CardTitle>
          </CardHeader>
          <CardContent>
            {byStaff.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byStaff.slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="hsl(200 80% 55%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Day of Week */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" /> Revenue by Day of Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDayOfWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} tickFormatter={(v) => `$${Math.round(v)}`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(330 80% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Spending Clients */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Top Spending Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No client data</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Avg / Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((client, i) => (
                    <TableRow key={client.clientId}>
                      <TableCell className="font-medium">{client.displayName}</TableCell>
                      <TableCell className="text-right">{client.visits}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                        ${client.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${(client.totalSpent / client.visits).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projections */}
      <Card className="border-border bg-gradient-to-br from-foreground/[0.03] to-foreground/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Revenue Projections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your current daily average of ${summary.dailyAverage.toFixed(2)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-5 bg-card rounded-xl border border-border">
              <span className="block text-xs text-muted-foreground mb-1">This Month</span>
              <span className="text-2xl sm:text-3xl font-display font-bold">${Math.round(summary.projectedMonthly).toLocaleString()}</span>
            </div>
            <div className="text-center p-5 bg-card rounded-xl border border-border">
              <span className="block text-xs text-muted-foreground mb-1">This Year</span>
              <span className="text-2xl sm:text-3xl font-display font-bold">${Math.round(summary.projectedYearly).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
