import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnalyticsOverview {
  totals: {
    views: number;
    bookings: number;
    revenue: number;
    favorites: number;
    reviews: number;
    canceled: number;
  };
  averages: {
    daily_views: number;
    daily_bookings: number;
    daily_revenue: number;
  };
  comparison: {
    views_change: number;
    bookings_change: number;
    revenue_change: number;
  } | null;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface HeatmapCell {
  day: string;
  day_index: number;
  hour: number;
  hour_label: string;
  bookings: number;
}

export interface PeakTime {
  day: string;
  hour_label: string;
  bookings: number;
}

function calcChange(oldVal: number, newVal: number): number {
  if (!oldVal || oldVal === 0) return newVal > 0 ? 100 : 0;
  return Math.round(((newVal - oldVal) / oldVal) * 100);
}

export function useAnalytics(businessId: string | null) {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [peakTimes, setPeakTimes] = useState<PeakTime[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOverview = useCallback(async (
    startDate: Date,
    endDate: Date,
    dayOfWeek: string,
    comparePrevious: boolean
  ) => {
    if (!businessId) return;

    try {
      // Build query for analytics_daily_stats
      let query = supabase
        .from('analytics_daily_stats')
        .select('profile_views, unique_visitors, bookings_completed, bookings_canceled, revenue, new_favorites, new_reviews')
        .eq('business_id', businessId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      if (dayOfWeek !== '') {
        query = query.eq('day_of_week', parseInt(dayOfWeek));
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = data || [];
      const totals = {
        views: rows.reduce((s, r) => s + (r.profile_views || 0), 0),
        bookings: rows.reduce((s, r) => s + (r.bookings_completed || 0), 0),
        revenue: rows.reduce((s, r) => s + Number(r.revenue || 0), 0),
        favorites: rows.reduce((s, r) => s + (r.new_favorites || 0), 0),
        reviews: rows.reduce((s, r) => s + (r.new_reviews || 0), 0),
        canceled: rows.reduce((s, r) => s + (r.bookings_canceled || 0), 0),
      };

      const count = rows.length || 1;
      const averages = {
        daily_views: Math.round(totals.views / count),
        daily_bookings: Math.round((totals.bookings / count) * 10) / 10,
        daily_revenue: Math.round((totals.revenue / count) * 100) / 100,
      };

      let comparison = null;
      if (comparePrevious) {
        const periodMs = endDate.getTime() - startDate.getTime();
        const prevEnd = new Date(startDate.getTime() - 86400000);
        const prevStart = new Date(prevEnd.getTime() - periodMs);

        let prevQuery = supabase
          .from('analytics_daily_stats')
          .select('profile_views, bookings_completed, revenue')
          .eq('business_id', businessId)
          .gte('date', prevStart.toISOString().split('T')[0])
          .lte('date', prevEnd.toISOString().split('T')[0]);

        if (dayOfWeek !== '') {
          prevQuery = prevQuery.eq('day_of_week', parseInt(dayOfWeek));
        }

        const { data: prevData } = await prevQuery;
        const prevRows = prevData || [];
        const prevViews = prevRows.reduce((s, r) => s + (r.profile_views || 0), 0);
        const prevBookings = prevRows.reduce((s, r) => s + (r.bookings_completed || 0), 0);
        const prevRevenue = prevRows.reduce((s, r) => s + Number(r.revenue || 0), 0);

        comparison = {
          views_change: calcChange(prevViews, totals.views),
          bookings_change: calcChange(prevBookings, totals.bookings),
          revenue_change: calcChange(prevRevenue, totals.revenue),
        };
      }

      // If no analytics_daily_stats data, fall back to real bookings data
      if (rows.length === 0) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('status, total_price, booking_date')
          .eq('business_id', businessId)
          .gte('booking_date', startDate.toISOString().split('T')[0])
          .lte('booking_date', endDate.toISOString().split('T')[0]);

        const bRows = bookingsData || [];
        const completed = bRows.filter(b => b.status === 'completed');
        const canceled = bRows.filter(b => b.status === 'canceled');
        const rev = completed.reduce((s, b) => s + Number(b.total_price || 0), 0);
        const days = Math.max(1, Math.ceil(periodMs(startDate, endDate) / 86400000));

        totals.bookings = completed.length;
        totals.revenue = rev;
        totals.canceled = canceled.length;
        averages.daily_bookings = Math.round((completed.length / days) * 10) / 10;
        averages.daily_revenue = Math.round((rev / days) * 100) / 100;

        // Get favorites count
        const { count: favCount } = await supabase
          .from('user_favorites')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);
        totals.favorites = favCount || 0;

        // Get reviews count
        const { count: revCount } = await supabase
          .from('reviews')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId);
        totals.reviews = revCount || 0;

        // Get view count from business
        const { data: biz } = await supabase
          .from('businesses')
          .select('view_count')
          .eq('id', businessId)
          .single();
        totals.views = biz?.view_count || 0;
        averages.daily_views = Math.round(totals.views / days);
      }

      setOverview({ totals, averages, comparison });
    } catch (err) {
      console.error('Analytics fetch error:', err);
    }
  }, [businessId]);

  const fetchChartData = useCallback(async (
    startDate: Date,
    endDate: Date,
    metric: string,
    groupBy: string,
    dayOfWeek: string
  ) => {
    if (!businessId) return;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (groupBy === 'day_of_week') {
      // Aggregate from bookings by day of week
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, booking_time, total_price, status')
        .eq('business_id', businessId)
        .gte('booking_date', startDate.toISOString().split('T')[0])
        .lte('booking_date', endDate.toISOString().split('T')[0]);

      const buckets: Record<number, { count: number; revenue: number }> = {};
      for (let i = 0; i < 7; i++) buckets[i] = { count: 0, revenue: 0 };

      (data || []).forEach(b => {
        const dow = new Date(b.booking_date).getDay();
        if (b.status === 'completed' || b.status === 'confirmed') {
          buckets[dow].count++;
          buckets[dow].revenue += Number(b.total_price || 0);
        }
      });

      const points: ChartDataPoint[] = Object.entries(buckets).map(([dow, val]) => ({
        label: dayNames[Number(dow)],
        value: metric === 'revenue' ? val.revenue : val.count,
      }));

      setChartData(points);
    } else {
      // Daily timeline from bookings
      const { data } = await supabase
        .from('bookings')
        .select('booking_date, total_price, status')
        .eq('business_id', businessId)
        .gte('booking_date', startDate.toISOString().split('T')[0])
        .lte('booking_date', endDate.toISOString().split('T')[0])
        .order('booking_date', { ascending: true });

      const grouped: Record<string, { count: number; revenue: number }> = {};
      (data || []).forEach(b => {
        if (b.status === 'completed' || b.status === 'confirmed' || b.status === 'pending') {
          if (!grouped[b.booking_date]) grouped[b.booking_date] = { count: 0, revenue: 0 };
          grouped[b.booking_date].count++;
          grouped[b.booking_date].revenue += Number(b.total_price || 0);
        }
      });

      const points: ChartDataPoint[] = Object.entries(grouped).map(([date, val]) => ({
        label: new Date(date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: metric === 'revenue' ? val.revenue : val.count,
      }));

      setChartData(points);
    }
  }, [businessId]);

  const fetchPeakTimes = useCallback(async () => {
    if (!businessId) return;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data } = await supabase
      .from('bookings')
      .select('booking_date, booking_time, status')
      .eq('business_id', businessId)
      .gte('booking_date', ninetyDaysAgo.toISOString().split('T')[0])
      .in('status', ['completed', 'confirmed']);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const heatmapData: Record<string, number> = {};

    (data || []).forEach(b => {
      const dow = new Date(b.booking_date).getDay();
      const hour = parseInt(b.booking_time.split(':')[0]);
      const key = `${dow}-${hour}`;
      heatmapData[key] = (heatmapData[key] || 0) + 1;
    });

    const cells: HeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 20; hour++) {
        const key = `${day}-${hour}`;
        cells.push({
          day: dayNames[day],
          day_index: day,
          hour,
          hour_label: `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`,
          bookings: heatmapData[key] || 0,
        });
      }
    }

    const peaks = [...cells].sort((a, b) => b.bookings - a.bookings).slice(0, 5);
    setHeatmap(cells);
    setPeakTimes(peaks);
  }, [businessId]);

  const fetchAll = useCallback(async (
    startDate: Date,
    endDate: Date,
    dayOfWeek: string,
    comparePrevious: boolean,
    metric: string,
    groupBy: string
  ) => {
    setLoading(true);
    await Promise.all([
      fetchOverview(startDate, endDate, dayOfWeek, comparePrevious),
      fetchChartData(startDate, endDate, metric, groupBy, dayOfWeek),
      fetchPeakTimes(),
    ]);
    setLoading(false);
  }, [fetchOverview, fetchChartData, fetchPeakTimes]);

  return { overview, chartData, heatmap, peakTimes, loading, fetchAll };
}

function periodMs(start: Date, end: Date) {
  return end.getTime() - start.getTime();
}
