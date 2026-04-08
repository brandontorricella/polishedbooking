import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

export interface ReportConfig {
  date_range: string;
  custom_start: string;
  custom_end: string;
  service_ids: string[];
  staff_ids: string[];
  metrics: string[];
  chart_type: 'line' | 'bar' | 'area' | 'none';
}

export interface CustomReport {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  config: ReportConfig;
  is_favorite: boolean;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportResults {
  summary: Record<string, number>;
  time_series: { date: string; count: number; completed: number; revenue: number }[];
  top_services: { name: string; count: number; revenue: number }[];
  top_staff: { name: string; count: number; revenue: number }[];
  date_range_label: string;
  generated_at: string;
}

const DATE_RANGE_LABELS: Record<string, string> = {
  '7_days': 'Last 7 Days',
  '30_days': 'Last 30 Days',
  '90_days': 'Last 90 Days',
  'this_month': 'This Month',
  'last_month': 'Last Month',
  'this_year': 'This Year',
};

function resolveDateRange(config: ReportConfig): { start: Date; end: Date; label: string } {
  const now = new Date();
  let start: Date, end: Date;

  switch (config.date_range) {
    case '7_days': start = subDays(now, 7); end = now; break;
    case '30_days': start = subDays(now, 30); end = now; break;
    case '90_days': start = subDays(now, 90); end = now; break;
    case 'this_month': start = startOfMonth(now); end = now; break;
    case 'last_month': start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1)); break;
    case 'this_year': start = startOfYear(now); end = now; break;
    case 'custom':
      start = new Date(config.custom_start);
      end = new Date(config.custom_end);
      break;
    default: start = subDays(now, 30); end = now;
  }

  const label = config.date_range === 'custom'
    ? `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
    : DATE_RANGE_LABELS[config.date_range] || 'Last 30 Days';

  return { start, end, label };
}

export function useCustomReports(businessId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<CustomReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_reports')
      .select('*')
      .eq('business_id', businessId)
      .order('is_favorite', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: 'Failed to load reports', variant: 'destructive' });
    } else {
      setReports((data || []).map(r => ({ ...r, config: r.config as unknown as ReportConfig })));
    }
    setLoading(false);
  }, [businessId, toast]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const createReport = async (name: string, description: string, config: ReportConfig): Promise<CustomReport | null> => {
    if (!businessId) return null;
    const { data, error } = await supabase
      .from('custom_reports')
      .insert({ business_id: businessId, name, description, config: config as any })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create report', variant: 'destructive' });
      return null;
    }
    await fetchReports();
    return { ...data, config: data.config as unknown as ReportConfig };
  };

  const updateReport = async (id: string, updates: Partial<{ name: string; description: string; config: ReportConfig; is_favorite: boolean }>) => {
    const payload: any = { ...updates, updated_at: new Date().toISOString() };
    if (updates.config) payload.config = updates.config as any;
    const { error } = await supabase.from('custom_reports').update(payload).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update report', variant: 'destructive' });
    } else {
      await fetchReports();
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from('custom_reports').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete report', variant: 'destructive' });
    } else {
      await fetchReports();
    }
  };

  const runReport = async (report: CustomReport): Promise<ReportResults | null> => {
    if (!businessId) return null;
    const config = report.config;
    const { start, end, label } = resolveDateRange(config);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    const metrics = config.metrics || [];

    try {
      // Fetch all bookings in date range
      let query = supabase
        .from('bookings')
        .select('id, client_id, service_id, staff_id, booking_date, status, total_price, tip_amount')
        .eq('business_id', businessId)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr);

      if (config.service_ids?.length > 0) query = query.in('service_id', config.service_ids);
      if (config.staff_ids?.length > 0) query = query.in('staff_id', config.staff_ids);

      const { data: allBookings, error: bookingsError } = await query;
      if (bookingsError) throw bookingsError;

      const bookings = allBookings || [];
      const completed = bookings.filter(b => b.status === 'completed');
      const canceled = bookings.filter(b => b.status === 'canceled');
      const noShows = bookings.filter(b => (b.status as string) === 'no_show');
      const revenue = completed.reduce((s, b) => s + Number(b.total_price || 0), 0);
      const tips = completed.reduce((s, b) => s + Number(b.tip_amount || 0), 0);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

      const summary: Record<string, number> = {};
      if (metrics.includes('total_bookings')) summary.total_bookings = bookings.length;
      if (metrics.includes('completed')) summary.completed = completed.length;
      if (metrics.includes('canceled')) summary.canceled = canceled.length;
      if (metrics.includes('no_shows')) summary.no_shows = noShows.length;
      if (metrics.includes('completion_rate')) summary.completion_rate = bookings.length > 0 ? Math.round((completed.length / bookings.length) * 100) : 0;
      if (metrics.includes('cancellation_rate')) summary.cancellation_rate = bookings.length > 0 ? Math.round((canceled.length / bookings.length) * 100) : 0;
      if (metrics.includes('revenue')) summary.revenue = Number(revenue.toFixed(2));
      if (metrics.includes('avg_order_value')) summary.avg_order_value = completed.length > 0 ? Number((revenue / completed.length).toFixed(2)) : 0;
      if (metrics.includes('tips')) summary.tips = Number(tips.toFixed(2));
      if (metrics.includes('daily_avg_revenue')) summary.daily_avg_revenue = Number((revenue / days).toFixed(2));

      // New vs returning clients
      if (metrics.includes('new_clients') || metrics.includes('returning_clients') || metrics.includes('retention_rate')) {
        const { data: allHistory } = await supabase
          .from('bookings')
          .select('client_id, booking_date')
          .eq('business_id', businessId)
          .eq('status', 'completed');

        const firstVisits: Record<string, string> = {};
        (allHistory || []).forEach(b => {
          if (!firstVisits[b.client_id] || b.booking_date < firstVisits[b.client_id]) {
            firstVisits[b.client_id] = b.booking_date;
          }
        });

        let newCount = 0, returningCount = 0;
        completed.forEach(b => {
          if (firstVisits[b.client_id] && firstVisits[b.client_id] >= startStr) newCount++;
          else returningCount++;
        });

        if (metrics.includes('new_clients')) summary.new_clients = newCount;
        if (metrics.includes('returning_clients')) summary.returning_clients = returningCount;
        if (metrics.includes('retention_rate')) {
          const total = newCount + returningCount;
          summary.retention_rate = total > 0 ? Math.round((returningCount / total) * 100) : 0;
        }
      }

      // Top services
      let topServices: { name: string; count: number; revenue: number }[] = [];
      if (metrics.includes('top_services')) {
        const serviceIds = [...new Set(completed.map(b => b.service_id))];
        if (serviceIds.length > 0) {
          const { data: services } = await supabase.from('services').select('id, name').in('id', serviceIds);
          const serviceMap = Object.fromEntries((services || []).map(s => [s.id, s.name]));
          const agg: Record<string, { name: string; count: number; revenue: number }> = {};
          completed.forEach(b => {
            const name = serviceMap[b.service_id] || 'Unknown';
            if (!agg[b.service_id]) agg[b.service_id] = { name, count: 0, revenue: 0 };
            agg[b.service_id].count++;
            agg[b.service_id].revenue += Number(b.total_price || 0);
          });
          topServices = Object.values(agg).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
        }
      }

      // Top staff
      let topStaff: { name: string; count: number; revenue: number }[] = [];
      if (metrics.includes('top_staff')) {
        const staffIds = [...new Set(completed.filter(b => b.staff_id).map(b => b.staff_id!))];
        if (staffIds.length > 0) {
          const { data: staffMembers } = await supabase.from('staff_members').select('id, name').in('id', staffIds);
          const staffMap = Object.fromEntries((staffMembers || []).map(s => [s.id, s.name]));
          const agg: Record<string, { name: string; count: number; revenue: number }> = {};
          completed.filter(b => b.staff_id).forEach(b => {
            const name = staffMap[b.staff_id!] || 'Unknown';
            if (!agg[b.staff_id!]) agg[b.staff_id!] = { name, count: 0, revenue: 0 };
            agg[b.staff_id!].count++;
            agg[b.staff_id!].revenue += Number(b.total_price || 0);
          });
          topStaff = Object.values(agg).sort((a, b) => b.revenue - a.revenue);
        }
      }

      // Time series
      const dateAgg: Record<string, { date: string; count: number; completed: number; revenue: number }> = {};
      bookings.forEach(b => {
        const d = b.booking_date;
        if (!dateAgg[d]) dateAgg[d] = { date: d, count: 0, completed: 0, revenue: 0 };
        dateAgg[d].count++;
        if (b.status === 'completed') {
          dateAgg[d].completed++;
          dateAgg[d].revenue += Number(b.total_price || 0);
        }
      });
      const timeSeries = Object.values(dateAgg).sort((a, b) => a.date.localeCompare(b.date));

      // Update last_run_at
      await supabase.from('custom_reports').update({ last_run_at: new Date().toISOString() }).eq('id', report.id);

      // Update local state
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, last_run_at: new Date().toISOString() } : r));

      return {
        summary,
        time_series: timeSeries,
        top_services: topServices,
        top_staff: topStaff,
        date_range_label: label,
        generated_at: new Date().toISOString(),
      };
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to run report', variant: 'destructive' });
      return null;
    }
  };

  return { reports, loading, fetchReports, createReport, updateReport, deleteReport, runReport };
}
