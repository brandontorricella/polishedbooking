import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Calendar, DollarSign, Heart, ArrowUp, ArrowDown,
  TrendingUp, BarChart3, Clock, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/lib/utils';
import { useAnalytics, type AnalyticsOverview, type ChartDataPoint, type HeatmapCell, type PeakTime } from '@/hooks/useAnalytics';

interface AnalyticsDashboardProps {
  businessId: string;
}

// ─── Stat Card ──────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const StatCard = ({ title, value, change, icon, active, onClick }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={onClick ? { y: -2 } : undefined}
    onClick={onClick}
    className={cn(
      "p-4 sm:p-5 bg-card rounded-2xl border transition-colors",
      onClick && "cursor-pointer",
      active ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-xl sm:text-2xl font-display font-bold mt-1">{value}</p>
        {typeof change === 'number' && (
          <div className={cn(
            "flex items-center gap-1 mt-1.5 text-xs sm:text-sm",
            change >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {change >= 0 ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
            <span>{Math.abs(change)}% vs prev</span>
          </div>
        )}
      </div>
      <div className={cn(
        "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0",
        active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
    </div>
  </motion.div>
);

// ─── Peak Times Heatmap ─────────────────────────────────
const PeakTimesHeatmap = ({ data }: { data: HeatmapCell[] }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  const maxBookings = Math.max(...data.map(d => d.bookings), 1);

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-[500px]">
        {/* Hour labels */}
        <div className="flex ml-12 mb-1">
          {hours.map(h => (
            <div key={h} className="flex-1 text-center text-[10px] sm:text-xs text-muted-foreground">
              {h > 12 ? h - 12 : h}{h >= 12 ? 'p' : 'a'}
            </div>
          ))}
        </div>
        {/* Grid rows */}
        {days.map((day, dayIdx) => (
          <div key={day} className="flex items-center gap-1 mb-1">
            <span className="w-10 text-xs text-muted-foreground text-right pr-1">{day}</span>
            <div className="flex flex-1 gap-0.5">
              {hours.map(hour => {
                const cell = data.find(d => d.day_index === dayIdx && d.hour === hour);
                const intensity = cell ? cell.bookings / maxBookings : 0;
                return (
                  <div
                    key={hour}
                    className="flex-1 aspect-square rounded-sm transition-colors"
                    style={{
                      backgroundColor: intensity > 0
                        ? `hsl(330 80% 60% / ${0.15 + intensity * 0.85})`
                        : 'hsl(var(--muted))',
                    }}
                    title={cell ? `${cell.day} ${cell.hour_label}: ${cell.bookings} bookings` : ''}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ──────────────────────────────────────────
export const AnalyticsDashboard = ({ businessId }: AnalyticsDashboardProps) => {
  const [dateRange, setDateRange] = useState('30');
  const [dayFilter, setDayFilter] = useState('');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'views' | 'bookings' | 'revenue'>('bookings');
  const [chartGroupBy, setChartGroupBy] = useState<'day' | 'day_of_week'>('day');

  const { overview, chartData, heatmap, peakTimes, loading, fetchAll } = useAnalytics(businessId);

  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    fetchAll(start, end, dayFilter, compareEnabled, activeMetric, chartGroupBy);
  }, [dateRange, dayFilter, compareEnabled, activeMetric, chartGroupBy, fetchAll]);

  const dayOptions = [
    { value: 'all', label: 'All Days' },
    { value: '0', label: 'Sundays' },
    { value: '1', label: 'Mondays' },
    { value: '2', label: 'Tuesdays' },
    { value: '3', label: 'Wednesdays' },
    { value: '4', label: 'Thursdays' },
    { value: '5', label: 'Fridays' },
    { value: '6', label: 'Saturdays' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const metricLabel = activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1);
  const formattedChartData = chartData.map(d => ({ name: d.label, value: d.value }));

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
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
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
                <Filter className="w-3.5 h-3.5" /> Day of Week
              </Label>
              <Select value={dayFilter || 'all'} onValueChange={(v) => setDayFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pb-0.5">
              <Switch
                id="compare-toggle"
                checked={compareEnabled}
                onCheckedChange={setCompareEnabled}
              />
              <Label htmlFor="compare-toggle" className="text-xs sm:text-sm cursor-pointer">
                Compare previous
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Profile Views"
          value={(overview?.totals.views || 0).toLocaleString()}
          change={overview?.comparison?.views_change}
          icon={<Eye className="w-5 h-5" />}
          active={activeMetric === 'views'}
          onClick={() => setActiveMetric('views')}
        />
        <StatCard
          title="Bookings"
          value={overview?.totals.bookings || 0}
          change={overview?.comparison?.bookings_change}
          icon={<Calendar className="w-5 h-5" />}
          active={activeMetric === 'bookings'}
          onClick={() => setActiveMetric('bookings')}
        />
        <StatCard
          title="Revenue"
          value={`$${(overview?.totals.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          change={overview?.comparison?.revenue_change}
          icon={<DollarSign className="w-5 h-5" />}
          active={activeMetric === 'revenue'}
          onClick={() => setActiveMetric('revenue')}
        />
        <StatCard
          title="Favorites"
          value={overview?.totals.favorites || 0}
          icon={<Heart className="w-5 h-5" />}
        />
      </div>

      {/* Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="font-display text-lg">{metricLabel} Over Time</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={chartGroupBy === 'day' ? 'default' : 'outline'}
                size="sm"
                className={cn("h-7 text-xs", chartGroupBy === 'day' && "bg-primary text-primary-foreground")}
                onClick={() => setChartGroupBy('day')}
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Timeline
              </Button>
              <Button
                variant={chartGroupBy === 'day_of_week' ? 'default' : 'outline'}
                size="sm"
                className={cn("h-7 text-xs", chartGroupBy === 'day_of_week' && "bg-primary text-primary-foreground")}
                onClick={() => setChartGroupBy('day_of_week')}
              >
                <BarChart3 className="w-3.5 h-3.5 mr-1" /> By Day
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56 sm:h-64">
            {formattedChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data for this period
              </div>
            ) : chartGroupBy === 'day' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedChartData}>
                  <defs>
                    <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(330 80% 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(330 80% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}
                    allowDecimals={activeMetric === 'revenue'}
                    tickFormatter={(v) => activeMetric === 'revenue' ? `$${v}` : String(v)} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [
                      activeMetric === 'revenue' ? `$${value.toLocaleString()}` : value,
                      metricLabel,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(330 80% 60%)"
                    strokeWidth={2}
                    fill="url(#analyticsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11}
                    allowDecimals={activeMetric === 'revenue'}
                    tickFormatter={(v) => activeMetric === 'revenue' ? `$${v}` : String(v)} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [
                      activeMetric === 'revenue' ? `$${value.toLocaleString()}` : value,
                      metricLabel,
                    ]}
                  />
                  <Bar dataKey="value" fill="hsl(330 80% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peak Times + Daily Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Peak Times Heatmap */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Busiest Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PeakTimesHeatmap data={heatmap} />
            {peakTimes.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Peak Hours</p>
                {peakTimes.map((peak, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{peak.day} at {peak.hour_label}</span>
                    <span className="text-muted-foreground">({peak.bookings} bookings)</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Averages */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-lg">Daily Averages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'views / day', value: overview?.averages.daily_views || 0, prefix: '' },
                { label: 'bookings / day', value: overview?.averages.daily_bookings || 0, prefix: '' },
                { label: 'revenue / day', value: overview?.averages.daily_revenue || 0, prefix: '$' },
              ].map((avg) => (
                <motion.div
                  key={avg.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center p-5 bg-muted/50 rounded-xl"
                >
                  <span className="block text-3xl font-display font-bold">
                    {avg.prefix}{typeof avg.value === 'number' ? avg.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : avg.value}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">{avg.label}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
