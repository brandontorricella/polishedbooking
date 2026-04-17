import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FeatureGate, LockedFeaturePage } from '@/components/subscription/FeatureGate';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { useCustomReports, type CustomReport, type ReportConfig, type ReportResults } from '@/hooks/useCustomReports';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileSpreadsheet, Plus, Play, Star, Pencil, Trash2, Download, RefreshCw, Lock, ArrowRight, BarChart3, TrendingUp, LineChart, AreaChart, Hash, Loader2
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart as ReLineChart, Line, BarChart, Bar, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { format } from 'date-fns';

const AVAILABLE_METRICS = [
  { id: 'total_bookings', label: 'Total Bookings', group: 'Bookings' },
  { id: 'completed', label: 'Completed Bookings', group: 'Bookings' },
  { id: 'canceled', label: 'Cancellations', group: 'Bookings' },
  { id: 'no_shows', label: 'No-Shows', group: 'Bookings' },
  { id: 'completion_rate', label: 'Completion Rate %', group: 'Bookings' },
  { id: 'cancellation_rate', label: 'Cancellation Rate %', group: 'Bookings' },
  { id: 'revenue', label: 'Total Revenue', group: 'Revenue' },
  { id: 'avg_order_value', label: 'Avg Order Value', group: 'Revenue' },
  { id: 'tips', label: 'Total Tips', group: 'Revenue' },
  { id: 'daily_avg_revenue', label: 'Daily Avg Revenue', group: 'Revenue' },
  { id: 'new_clients', label: 'New Clients', group: 'Clients' },
  { id: 'returning_clients', label: 'Returning Clients', group: 'Clients' },
  { id: 'retention_rate', label: 'Retention Rate %', group: 'Clients' },
  { id: 'top_services', label: 'Top Services by Revenue', group: 'Services' },
  { id: 'top_staff', label: 'Top Staff by Revenue', group: 'Staff' },
];

const METRIC_GROUPS = ['Bookings', 'Revenue', 'Clients', 'Services', 'Staff'];

const CURRENCY_METRICS = ['revenue', 'avg_order_value', 'tips', 'daily_avg_revenue'];
const PCT_METRICS = ['completion_rate', 'cancellation_rate', 'retention_rate'];

const METRIC_LABELS: Record<string, string> = Object.fromEntries(AVAILABLE_METRICS.map(m => [m.id, m.label]));

function formatMetricValue(metric: string, value: number | undefined | null): string {
  if (value === undefined || value === null) return '—';
  if (CURRENCY_METRICS.includes(metric)) return `$${Number(value).toFixed(2)}`;
  if (PCT_METRICS.includes(metric)) return `${value}%`;
  return value.toLocaleString();
}

const DEFAULT_CONFIG: ReportConfig = {
  date_range: '30_days',
  custom_start: '',
  custom_end: '',
  service_ids: [],
  staff_ids: [],
  metrics: ['total_bookings', 'completed', 'revenue', 'avg_order_value'],
  chart_type: 'line',
};

export default function BusinessCustomReports() {
  const { user } = useAuth();
  const { hasFeature } = useFeatureAccess();
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('businesses').select('id').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => setBusinessId(data?.id || null));
  }, [user]);

  if (!hasFeature('custom_reports')) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <LockedFeaturePage
            icon={<FileSpreadsheet className="w-8 h-8 text-muted-foreground" />}
            title="Custom Report Builder"
            description="Create, save, and run fully configurable analytics reports tailored to your business."
            requiredTier="elite"
            benefits={['Choose from 15+ metrics', 'Filter by service and staff', 'Save and rerun reports anytime', 'Export results to CSV', 'Line, bar, and area charts']}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {businessId ? <ReportsContent businessId={businessId} /> : (
          <div className="text-center py-20 text-muted-foreground">No business found.</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ReportsContent({ businessId }: { businessId: string }) {
  const { reports, loading, createReport, updateReport, deleteReport, runReport } = useCustomReports(businessId);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingReport, setEditingReport] = useState<CustomReport | null>(null);
  const [reportResults, setReportResults] = useState<{ report: CustomReport; data: ReportResults } | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRun = async (report: CustomReport) => {
    setRunningId(report.id);
    const data = await runReport(report);
    if (data) setReportResults({ report, data });
    setRunningId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteReport(id);
    if (reportResults?.report.id === id) setReportResults(null);
    toast({ title: 'Report deleted' });
  };

  const favorites = reports.filter(r => r.is_favorite);
  const nonFavorites = reports.filter(r => !r.is_favorite);

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="w-6 h-6" /> Custom Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Build and save reports with the exact metrics you care about</p>
        </div>
        <Button onClick={() => { setEditingReport(null); setShowBuilder(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Report
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 min-h-[500px]">
          {/* Sidebar */}
          <Card className="h-fit">
            <CardContent className="p-3">
              {reports.length === 0 ? (
                <div className="text-center py-10">
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">No reports yet</p>
                  <Button size="sm" onClick={() => setShowBuilder(true)}>Create Report</Button>
                </div>
              ) : (
                <>
                  {favorites.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">⭐ Favorites</p>
                      {favorites.map(r => (
                        <ReportListItem key={r.id} report={r} isActive={reportResults?.report.id === r.id}
                          isRunning={runningId === r.id} onRun={() => handleRun(r)}
                          onEdit={() => { setEditingReport(r); setShowBuilder(true); }}
                          onToggleFavorite={() => updateReport(r.id, { is_favorite: !r.is_favorite })}
                          onDelete={() => handleDelete(r.id)} />
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">All Reports</p>
                    {nonFavorites.map(r => (
                      <ReportListItem key={r.id} report={r} isActive={reportResults?.report.id === r.id}
                        isRunning={runningId === r.id} onRun={() => handleRun(r)}
                        onEdit={() => { setEditingReport(r); setShowBuilder(true); }}
                        onToggleFavorite={() => updateReport(r.id, { is_favorite: !r.is_favorite })}
                        onDelete={() => handleDelete(r.id)} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="min-h-[400px]">
            <CardContent className="p-6">
              {reportResults ? (
                <ReportResultsView report={reportResults.report} data={reportResults.data}
                  onRerun={() => handleRun(reportResults.report)} isRunning={runningId === reportResults.report.id} />
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-3">
                  <BarChart3 className="w-12 h-12" />
                  <p className="text-sm">Select a report and click Run to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showBuilder && (
        <ReportBuilderModal
          businessId={businessId}
          report={editingReport}
          onClose={() => { setShowBuilder(false); setEditingReport(null); }}
          onSaved={async (report) => {
            setShowBuilder(false);
            setEditingReport(null);
            await handleRun(report);
          }}
          createReport={createReport}
          updateReport={updateReport}
        />
      )}
    </>
  );
}

function ReportListItem({ report, isActive, isRunning, onRun, onEdit, onToggleFavorite, onDelete }: {
  report: CustomReport; isActive: boolean; isRunning: boolean;
  onRun: () => void; onEdit: () => void; onToggleFavorite: () => void; onDelete: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50",
      isActive && "bg-primary/10"
    )} onClick={onRun}>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-semibold truncate">{report.name}</span>
        {report.last_run_at && (
          <span className="block text-[11px] text-muted-foreground mt-0.5">
            Last run {format(new Date(report.last_run_at), 'MMM d')}
          </span>
        )}
      </div>
      <div className="flex gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleFavorite}>
          <Star className={cn("w-3.5 h-3.5", report.is_favorite && "fill-amber-400 text-amber-400")} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function ReportBuilderModal({ businessId, report: existingReport, onClose, onSaved, createReport, updateReport }: {
  businessId: string;
  report: CustomReport | null;
  onClose: () => void;
  onSaved: (report: CustomReport) => void;
  createReport: (name: string, desc: string, config: ReportConfig) => Promise<CustomReport | null>;
  updateReport: (id: string, updates: any) => Promise<void>;
}) {
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [name, setName] = useState(existingReport?.name || '');
  const [description, setDescription] = useState(existingReport?.description || '');
  const [config, setConfig] = useState<ReportConfig>(existingReport?.config || { ...DEFAULT_CONFIG });

  useEffect(() => {
    Promise.all([
      supabase.from('services').select('id, name').eq('business_id', businessId),
      supabase.from('staff_members').select('id, name').eq('business_id', businessId),
    ]).then(([sRes, stRes]) => {
      setServices(sRes.data || []);
      setStaff(stRes.data || []);
    });
  }, [businessId]);

  const toggleMetric = (id: string) => {
    setConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(id) ? prev.metrics.filter(m => m !== id) : [...prev.metrics, id],
    }));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Report name is required', variant: 'destructive' }); return; }
    if (config.metrics.length === 0) { toast({ title: 'Select at least one metric', variant: 'destructive' }); return; }
    setSaving(true);

    if (existingReport) {
      await updateReport(existingReport.id, { name, description, config });
      onSaved({ ...existingReport, name, description, config });
    } else {
      const created = await createReport(name, description, config);
      if (created) onSaved(created);
    }
    setSaving(false);
  };

  const chartTypes = [
    { value: 'line' as const, label: 'Line', icon: LineChart, desc: 'Trends over time' },
    { value: 'bar' as const, label: 'Bar', icon: BarChart3, desc: 'Compare values' },
    { value: 'area' as const, label: 'Area', icon: AreaChart, desc: 'Volume over time' },
    { value: 'none' as const, label: 'None', icon: Hash, desc: 'Table only' },
  ];

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingReport ? 'Edit Report' : '📊 New Custom Report'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Report Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Revenue Summary" />
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={config.date_range} onValueChange={v => setConfig(prev => ({ ...prev, date_range: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7_days">Last 7 Days</SelectItem>
                <SelectItem value="30_days">Last 30 Days</SelectItem>
                <SelectItem value="90_days">Last 90 Days</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {config.date_range === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={config.custom_start} onChange={e => setConfig(prev => ({ ...prev, custom_start: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={config.custom_end} onChange={e => setConfig(prev => ({ ...prev, custom_end: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <Label>Metrics to Include *</Label>
              <p className="text-xs text-muted-foreground">Select all the data points you want in this report</p>
            </div>
            {METRIC_GROUPS.map(group => (
              <div key={group}>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">{group}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {AVAILABLE_METRICS.filter(m => m.group === group).map(metric => (
                    <label key={metric.id} className={cn(
                      "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors",
                      config.metrics.includes(metric.id) ? "border-primary bg-primary/5" : "border-border"
                    )}>
                      <Checkbox checked={config.metrics.includes(metric.id)} onCheckedChange={() => toggleMetric(metric.id)} />
                      {metric.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-right">{config.metrics.length} metric{config.metrics.length !== 1 ? 's' : ''} selected</p>
          </div>

          <Separator />

          {services.length > 0 && (
            <div className="space-y-2">
              <Label>Filter by Service</Label>
              <p className="text-xs text-muted-foreground">Leave empty to include all services</p>
              <div className="grid grid-cols-2 gap-1.5">
                {services.map(s => (
                  <label key={s.id} className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors",
                    config.service_ids.includes(s.id) ? "border-primary bg-primary/5" : "border-border"
                  )}>
                    <Checkbox checked={config.service_ids.includes(s.id)} onCheckedChange={checked => {
                      setConfig(prev => ({
                        ...prev,
                        service_ids: checked ? [...prev.service_ids, s.id] : prev.service_ids.filter(id => id !== s.id),
                      }));
                    }} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {staff.length > 0 && (
            <div className="space-y-2">
              <Label>Filter by Staff</Label>
              <p className="text-xs text-muted-foreground">Leave empty to include all staff</p>
              <div className="grid grid-cols-2 gap-1.5">
                {staff.map(s => (
                  <label key={s.id} className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer text-sm transition-colors",
                    config.staff_ids.includes(s.id) ? "border-primary bg-primary/5" : "border-border"
                  )}>
                    <Checkbox checked={config.staff_ids.includes(s.id)} onCheckedChange={checked => {
                      setConfig(prev => ({
                        ...prev,
                        staff_ids: checked ? [...prev.staff_ids, s.id] : prev.staff_ids.filter(id => id !== s.id),
                      }));
                    }} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Chart Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {chartTypes.map(ct => {
                const Icon = ct.icon;
                return (
                  <button key={ct.value} onClick={() => setConfig(prev => ({ ...prev, chart_type: ct.value }))}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 border rounded-lg text-sm font-semibold transition-colors",
                      config.chart_type === ct.value ? "border-primary bg-primary/5 text-primary" : "border-border"
                    )}>
                    <Icon className="w-5 h-5" />
                    {ct.label}
                    <span className="text-[10px] font-normal text-muted-foreground">{ct.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving...</> : existingReport ? 'Save Changes' : 'Save & Run Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportResultsView({ report, data, onRerun, isRunning }: {
  report: CustomReport; data: ReportResults; onRerun: () => void; isRunning: boolean;
}) {
  const config = report.config;

  const handleExportCSV = async () => {
    const csvRows: string[][] = [['Metric', 'Value']];
    if (data.summary) {
      Object.entries(data.summary).forEach(([key, value]) => {
        csvRows.push([key.replace(/_/g, ' '), String(value)]);
      });
    }
    if (data.time_series?.length > 0) {
      csvRows.push([]);
      csvRows.push(['Date', 'Count', 'Completed', 'Revenue']);
      data.time_series.forEach(row => {
        csvRows.push([row.date, String(row.count), String(row.completed), String(row.revenue)]);
      });
    }

    // Bookings detail incl. payment method + collected externally column
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const now = new Date();
      const sub = (d: Date, days: number) => new Date(d.getTime() - days * 86400000);
      let start: Date, end: Date;
      switch (config.date_range) {
        case '7_days': start = sub(now, 7); end = now; break;
        case '30_days': start = sub(now, 30); end = now; break;
        case '90_days': start = sub(now, 90); end = now; break;
        case 'this_month': start = new Date(now.getFullYear(), now.getMonth(), 1); end = now; break;
        case 'last_month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case 'this_year': start = new Date(now.getFullYear(), 0, 1); end = now; break;
        case 'custom': start = new Date(config.custom_start); end = new Date(config.custom_end); break;
        default: start = sub(now, 30); end = now;
      }
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      let q = supabase
        .from('bookings')
        .select('id, booking_date, booking_time, status, total_price, final_service_amount, tip_amount, payment_auth_type, payment_collected_inperson, service_id, staff_id')
        .eq('business_id', report.business_id)
        .gte('booking_date', startStr)
        .lte('booking_date', endStr);
      if (config.service_ids?.length > 0) q = q.in('service_id', config.service_ids);
      if (config.staff_ids?.length > 0) q = q.in('staff_id', config.staff_ids);

      const { data: bookings } = await q;
      const ids = (bookings || []).map(b => b.id);
      const payMap: Record<string, { method: string; note: string | null }> = {};
      if (ids.length > 0) {
        const { data: pays } = await supabase
          .from('inperson_payments')
          .select('booking_id, payment_method, payment_method_note')
          .in('booking_id', ids);
        (pays || []).forEach((p: any) => {
          payMap[p.booking_id] = { method: p.payment_method, note: p.payment_method_note };
        });
      }
      if (bookings && bookings.length > 0) {
        csvRows.push([]);
        csvRows.push(['Bookings Detail']);
        csvRows.push(['Booking ID', 'Date', 'Time', 'Status', 'Service Amount', 'Tip', 'Payment Method', 'Collected Externally']);
        bookings.forEach((b: any) => {
          const isExt = b.payment_auth_type === 'external' || !!b.payment_collected_inperson;
          const ext = payMap[b.id];
          const method = isExt
            ? (ext?.method ? `${ext.method}${ext.note ? ` (${ext.note.replace(/,/g, ';')})` : ''}` : 'external')
            : (b.payment_auth_type || 'online');
          csvRows.push([
            b.id,
            b.booking_date,
            b.booking_time,
            b.status || '',
            String(Number(b.final_service_amount ?? b.total_price ?? 0).toFixed(2)),
            String(Number(b.tip_amount || 0).toFixed(2)),
            method,
            isExt ? 'Yes' : 'No',
          ]);
        });
      }
    } catch (err) {
      console.error('Failed to append bookings detail to CSV', err);
    }

    const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = csvRows.map(row => row.map(c => esc(String(c ?? ''))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summaryMetrics = config.metrics.filter(m => data.summary[m] !== undefined && !['top_services', 'top_staff'].includes(m));

  return (
    <div>
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-bold">{report.name}</h2>
          <span className="text-sm text-muted-foreground">{data.date_range_label}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRerun} disabled={isRunning}>
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />} Rerun
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {summaryMetrics.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {summaryMetrics.map(metric => (
            <div key={metric} className="bg-muted/50 rounded-xl p-4 text-center">
              <span className="block text-2xl font-extrabold">{formatMetricValue(metric, data.summary[metric])}</span>
              <span className="block text-xs text-muted-foreground mt-1">{METRIC_LABELS[metric] || metric}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {config.chart_type !== 'none' && data.time_series?.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={280}>
            {config.chart_type === 'bar' ? (
              <BarChart data={data.time_series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip labelFormatter={d => format(new Date(d as string), 'MMM d, yyyy')} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : config.chart_type === 'area' ? (
              <ReAreaChart data={data.time_series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip labelFormatter={d => format(new Date(d as string), 'MMM d, yyyy')} />
                <Area type="monotone" dataKey="revenue" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
              </ReAreaChart>
            ) : (
              <ReLineChart data={data.time_series}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={d => format(new Date(d), 'MMM d')} className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip labelFormatter={d => format(new Date(d as string), 'MMM d, yyyy')} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ReLineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Services */}
      {config.metrics.includes('top_services') && data.top_services?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Top Services by Revenue</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Service</TableHead><TableHead>Bookings</TableHead><TableHead>Revenue</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.top_services.map((s, i) => (
                <TableRow key={i}><TableCell>{s.name}</TableCell><TableCell>{s.count}</TableCell><TableCell>${Number(s.revenue).toFixed(2)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Top Staff */}
      {config.metrics.includes('top_staff') && data.top_staff?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Top Staff by Revenue</h3>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Staff Member</TableHead><TableHead>Bookings</TableHead><TableHead>Revenue</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.top_staff.map((s, i) => (
                <TableRow key={i}><TableCell>{s.name}</TableCell><TableCell>{s.count}</TableCell><TableCell>${Number(s.revenue).toFixed(2)}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
