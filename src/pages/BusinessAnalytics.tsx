import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsDashboard } from '@/components/business/AnalyticsDashboard';
import { BookingAnalytics } from '@/components/business/BookingAnalytics';
import { RevenueAnalytics } from '@/components/business/RevenueAnalytics';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { BundleManager } from '@/components/bundles/BundleManager';
import { LoyaltyManager } from '@/components/loyalty/LoyaltyManager';
import { ClientNotesManager } from '@/components/clients/ClientNotesManager';
import { BusinessWaitlistManager } from '@/components/waitlist/BusinessWaitlistManager';
import { StaffManager } from '@/components/staff/StaffManager';
import { FollowupManager } from '@/components/followups/FollowupManager';
import { GalleryManager } from '@/components/gallery/GalleryManager';
import { FeatureGate, LockedFeaturePage } from '@/components/subscription/FeatureGate';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { PaymentWarningBanner } from '@/components/business/PaymentWarningBanner';
import { AIInsightsWidget } from '@/components/business/AIInsightsWidget';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Download, Calendar, RefreshCw, CreditCard, Crown, Sparkles, Lock, ArrowRight, Package, Star, Users, Hourglass, UserCheck, Send, Image, BarChart3, FileText, FileSpreadsheet, Loader2, Eye } from 'lucide-react';
import { useSubscription } from '@/hooks/useSuperwall';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';

const tierDetails = {
  basic: { name: 'Basic', icon: Sparkles, color: 'text-blue-500' },
  pro: { name: 'Pro', icon: Crown, color: 'text-primary' },
  elite: { name: 'Elite', icon: Crown, color: 'text-amber-500' },
};

// Sample dashboard overlay for non-authenticated users
const SampleDashboardOverlay = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent z-10 flex flex-col items-center justify-center"
    >
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Unlock Your Business Analytics
        </h2>
        <p className="text-muted-foreground mb-6">
          This is a sample dashboard. Sign up for a business account to track your real performance metrics, bookings, and revenue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth?mode=signup&role=business">
            <Button className="bg-gradient-primary text-primary-foreground">
              Start Free Trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/auth?mode=login&role=business">
            <Button variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

const FeatureGatedDashboard = ({ businessId, businessServices }: { businessId: string | null; businessServices: { id: string; name: string; price: number; duration: number }[] }) => {
  const { canAccessAnalytics, canSendPromotions, canAccessRebookingPrompts, galleryLimit, tier } = useFeatureAccess();

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookings" className="gap-1">
          {!canAccessAnalytics && <Lock className="w-3 h-3" />} Bookings
        </TabsTrigger>
        <TabsTrigger value="bundles"><Package className="w-4 h-4 mr-1" /> Bundles</TabsTrigger>
        <TabsTrigger value="loyalty"><Star className="w-4 h-4 mr-1" /> Loyalty</TabsTrigger>
        <TabsTrigger value="revenue" className="gap-1">
          {!canAccessAnalytics && <Lock className="w-3 h-3" />} Revenue
        </TabsTrigger>
        <TabsTrigger value="clients"><Users className="w-4 h-4 mr-1" /> Clients</TabsTrigger>
        <TabsTrigger value="waitlist"><Hourglass className="w-4 h-4 mr-1" /> Waitlist</TabsTrigger>
        <TabsTrigger value="staff"><UserCheck className="w-4 h-4 mr-1" /> Staff</TabsTrigger>
        <TabsTrigger value="followups" className="gap-1">
          {!canAccessRebookingPrompts && <Lock className="w-3 h-3" />}
          <Send className="w-4 h-4 mr-1" /> Follow-ups
        </TabsTrigger>
        <TabsTrigger value="gallery"><Image className="w-4 h-4 mr-1" /> Gallery</TabsTrigger>
      </TabsList>

      {/* Overview – always visible (basic stats) */}
      <TabsContent value="overview">
        {businessId ? <AnalyticsDashboard businessId={businessId} /> : <NoBusinessPlaceholder text="view analytics" />}
      </TabsContent>

      {/* Bookings – Pro+ */}
      <TabsContent value="bookings">
        <FeatureGate feature="analytics_dashboard">
          {businessId ? <BookingAnalytics businessId={businessId} /> : <NoBusinessPlaceholder text="view booking analytics" />}
        </FeatureGate>
      </TabsContent>

      {/* Bundles – all tiers */}
      <TabsContent value="bundles">
        {businessId ? <BundleManager businessId={businessId} services={businessServices} /> : <NoBusinessPlaceholder text="manage bundles" />}
      </TabsContent>

      {/* Loyalty – all tiers */}
      <TabsContent value="loyalty">
        {businessId ? <LoyaltyManager businessId={businessId} /> : <NoBusinessPlaceholder text="manage loyalty" />}
      </TabsContent>

      {/* Revenue – Pro+ */}
      <TabsContent value="revenue">
        <FeatureGate feature="analytics_dashboard">
          {businessId ? <RevenueAnalytics businessId={businessId} /> : <NoBusinessPlaceholder text="view revenue analytics" />}
        </FeatureGate>
      </TabsContent>

      {/* Clients – all tiers */}
      <TabsContent value="clients">
        {businessId ? <ClientNotesManager businessId={businessId} /> : <NoBusinessPlaceholder text="manage clients" />}
      </TabsContent>

      {/* Waitlist – all tiers */}
      <TabsContent value="waitlist">
        {businessId ? <BusinessWaitlistManager businessId={businessId} /> : <NoBusinessPlaceholder text="manage waitlist" />}
      </TabsContent>

      {/* Staff – all tiers */}
      <TabsContent value="staff">
        {businessId ? <StaffManager businessId={businessId} services={businessServices} /> : <NoBusinessPlaceholder text="manage staff" />}
      </TabsContent>

      {/* Follow-ups – Pro+ */}
      <TabsContent value="followups">
        <FeatureGate feature="client_rebooking_prompts"
          fallback={
            <LockedFeaturePage
              icon={<Send className="w-8 h-8 text-muted-foreground" />}
              title="Automated Follow-ups"
              description="Automatically remind clients to book again after their appointment."
              requiredTier="pro"
              benefits={['Automatic rebooking reminders', 'Customizable timing (7-60 days)', 'Include discount codes', 'Track rebook rates']}
            />
          }
        >
          {businessId ? <FollowupManager businessId={businessId} /> : <NoBusinessPlaceholder text="manage follow-ups" />}
        </FeatureGate>
      </TabsContent>

      {/* Gallery – all tiers, but limited */}
      <TabsContent value="gallery">
        {businessId ? <GalleryManager businessId={businessId} services={businessServices} galleryLimit={galleryLimit} tier={tier} /> : <NoBusinessPlaceholder text="manage gallery" />}
      </TabsContent>
    </Tabs>
  );
};

const NoBusinessPlaceholder = ({ text }: { text: string }) => (
  <div className="p-8 bg-card rounded-2xl border border-border text-center">
    <p className="text-muted-foreground">Set up your business profile to {text}</p>
  </div>
);

// ─── Date range helpers ─────────────────────────────────
type DatePreset = { label: string; getRange: () => { start: Date; end: Date } };

const DATE_PRESETS: DatePreset[] = [
  { label: 'Last 7 Days', getRange: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: 'Last 30 Days', getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: 'Last 90 Days', getRange: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: 'This Month', getRange: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: 'Last Month', getRange: () => ({ start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'This Year', getRange: () => ({ start: startOfYear(new Date()), end: new Date() }) },
];

function getDateLabel(start: Date, end: Date): string {
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 8 && diff >= 6) return 'Last 7 Days';
  if (diff <= 31 && diff >= 29) return 'Last 30 Days';
  if (diff <= 91 && diff >= 89) return 'Last 90 Days';
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}

// ─── CSV Export helper ──────────────────────────────────
async function exportAnalyticsCSV(businessId: string, start: Date, end: Date) {
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  // Fetch bookings for the period
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_date, booking_time, status, total_price, service_id, staff_id')
    .eq('business_id', businessId)
    .gte('booking_date', startStr)
    .lte('booking_date', endStr)
    .order('booking_date', { ascending: true });

  const rows = bookings || [];
  const completed = rows.filter(b => b.status === 'completed' || b.status === 'confirmed');
  const canceled = rows.filter(b => b.status === 'canceled');
  const totalRevenue = completed.reduce((s, b) => s + Number(b.total_price || 0), 0);

  let csv = `Analytics Report\n`;
  csv += `Period: ${format(start, 'MMM d, yyyy')} to ${format(end, 'MMM d, yyyy')}\n\n`;
  csv += `Summary\nMetric,Value\n`;
  csv += `Total Bookings,${rows.length}\n`;
  csv += `Completed,${completed.length}\n`;
  csv += `Canceled,${canceled.length}\n`;
  csv += `Total Revenue,$${totalRevenue.toFixed(2)}\n`;
  csv += `Avg Booking Value,$${completed.length ? (totalRevenue / completed.length).toFixed(2) : '0.00'}\n\n`;

  csv += `Booking Details\nDate,Time,Status,Price\n`;
  rows.forEach(b => {
    csv += `${b.booking_date},${b.booking_time},${b.status},$${Number(b.total_price || 0).toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `analytics_${startStr}_to_${endStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const BusinessAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, isLoading, refreshSubscription, manageSubscription, isTrialing, daysRemaining } = useSubscription();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessServices, setBusinessServices] = useState<{ id: string; name: string; price: number; duration: number }[]>([]);
  const [dateRange, setDateRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch business data for the logged-in owner
  useEffect(() => {
    if (!user) return;
    const fetchBusiness = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      if (data) {
        setBusinessId(data.id);
        const { data: svcData } = await supabase
          .from('services')
          .select('id, name, price, duration')
          .eq('business_id', data.id)
          .eq('is_active', true);
        setBusinessServices((svcData || []).map(s => ({ ...s, price: Number(s.price) })));
      }
    };
    fetchBusiness();
  }, [user]);

  const isAuthenticated = !!user;
  const isBusinessUser = profile?.role === 'business';
  const isClientUser = profile?.role === 'client';

  // Redirect client users away from analytics
  useEffect(() => {
    if (!authLoading && isAuthenticated && isClientUser) {
      toast({
        title: 'Access Restricted',
        description: 'Analytics is only available for business accounts.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [authLoading, isAuthenticated, isClientUser, navigate, toast]);

  // Check for success redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Subscription Active!',
        description: 'Your subscription is now active.',
      });
      refreshSubscription();
    }
  }, [searchParams, toast, refreshSubscription]);

  // Don't render for client users
  if (!authLoading && isAuthenticated && isClientUser) {
    return null;
  }

  const currentTier = subscription?.tier || 'basic';
  const TierIcon = tierDetails[currentTier]?.icon || Sparkles;

  // Show sample dashboard for non-authenticated users
  const showSampleDashboard = !isAuthenticated;

  const handleManageSubscription = () => {
    manageSubscription();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSubscription();
    setRefreshKey(k => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      sonnerToast.success('Analytics refreshed');
    }, 600);
  };

  const handleExportCSV = async () => {
    if (!businessId) return;
    setIsExporting(true);
    try {
      await exportAnalyticsCSV(businessId, dateRange.start, dateRange.end);
      sonnerToast.success('CSV exported successfully');
    } catch {
      sonnerToast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDatePreset = (preset: DatePreset) => {
    setDateRange(preset.getRange());
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {isBusinessUser && <SubscriptionBanner />}
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Payment Warning Banner */}
          {isBusinessUser && <PaymentWarningBanner />}
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">
                {showSampleDashboard ? 'Sample Business Analytics' : 'Business Analytics'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {showSampleDashboard 
                  ? 'See how you can track your business performance'
                  : 'Track your performance and grow your business'
                }
              </p>
            </div>
            {isBusinessUser && (
              <div className="flex gap-2 mt-4 md:mt-0 flex-wrap">
                {/* View Storefront */}
                {businessId && (
                  <Link to={`/business/${businessId}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="w-4 h-4" />
                      View My Storefront
                    </Button>
                  </Link>
                )}
                {/* Date Range Picker */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      {getDateLabel(dateRange.start, dateRange.end)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {DATE_PRESETS.map((preset) => (
                      <DropdownMenuItem
                        key={preset.label}
                        onClick={() => handleDatePreset(preset)}
                      >
                        {preset.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className="px-3 py-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                            Custom Range…
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end" side="left">
                          <CalendarComponent
                            mode="range"
                            selected={{ from: dateRange.start, to: dateRange.end }}
                            onSelect={(range) => {
                              if (range?.from && range?.to) {
                                setDateRange({ start: range.from, end: range.to });
                                setRefreshKey(k => k + 1);
                              } else if (range?.from) {
                                setDateRange({ start: range.from, end: range.from });
                              }
                            }}
                            numberOfMonths={2}
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                  {isRefreshing ? 'Refreshing…' : 'Refresh'}
                </Button>

                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isExporting || !businessId}>
                      {isExporting
                        ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        : <Download className="w-4 h-4 mr-2" />
                      }
                      {isExporting ? 'Exporting…' : 'Export'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        sonnerToast.info('PDF export coming soon');
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Subscription Card - Only for business users */}
          {isBusinessUser && (
            <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TierIcon className={cn("w-5 h-5", tierDetails[currentTier]?.color)} />
                  {tierDetails[currentTier]?.name} Plan
                  {isTrialing && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-2">
                      Trial
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    {isTrialing && daysRemaining !== null && (
                      <p className="text-sm text-muted-foreground">
                        {daysRemaining} days remaining in your trial
                      </p>
                    )}
                    {subscription?.subscriptionEndDate && !isTrialing && (
                      <p className="text-sm text-muted-foreground">
                        Renews on {new Date(subscription.subscriptionEndDate).toLocaleDateString()}
                      </p>
                    )}
                    {!subscription?.isActive && !isTrialing && (
                      <p className="text-sm text-muted-foreground">
                        No active subscription
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          <div className="relative">
            {showSampleDashboard && <SampleDashboardOverlay />}
            
            <div className={cn(showSampleDashboard && "pointer-events-none select-none")}>
              <FeatureGatedDashboard key={refreshKey} businessId={businessId} businessServices={businessServices} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessAnalyticsPage;
