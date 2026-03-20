import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsDashboard } from '@/components/business/AnalyticsDashboard';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { BundleManager } from '@/components/bundles/BundleManager';
import { LoyaltyManager } from '@/components/loyalty/LoyaltyManager';
import { ClientNotesManager } from '@/components/clients/ClientNotesManager';
import { BusinessWaitlistManager } from '@/components/waitlist/BusinessWaitlistManager';
import { StaffManager } from '@/components/staff/StaffManager';
import { FollowupManager } from '@/components/followups/FollowupManager';
import { GalleryManager } from '@/components/gallery/GalleryManager';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Calendar, RefreshCw, CreditCard, Crown, Sparkles, Lock, ArrowRight, Package, Star, Users, Hourglass, UserCheck, Send, Image } from 'lucide-react';
import { useSuperwall } from '@/hooks/useSuperwall';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

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

const BusinessAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const { subscription, isLoading, refreshSubscription, showPaywall, isTrialing, daysRemaining } = useSuperwall();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessServices, setBusinessServices] = useState<{ id: string; name: string; price: number; duration: number }[]>([]);

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
    if (subscription) {
      showPaywall(subscription.tier);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {isBusinessUser && <SubscriptionBanner />}
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
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
              <div className="flex gap-2 mt-4 md:mt-0">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => refreshSubscription()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
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
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="bookings">Bookings</TabsTrigger>
                  <TabsTrigger value="bundles">
                    <Package className="w-4 h-4 mr-1" /> Bundles
                  </TabsTrigger>
                  <TabsTrigger value="loyalty">
                    <Star className="w-4 h-4 mr-1" /> Loyalty
                  </TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                  <TabsTrigger value="clients">
                    <Users className="w-4 h-4 mr-1" /> Clients
                  </TabsTrigger>
                  <TabsTrigger value="waitlist">
                    <Hourglass className="w-4 h-4 mr-1" /> Waitlist
                  </TabsTrigger>
                  <TabsTrigger value="staff">
                    <UserCheck className="w-4 h-4 mr-1" /> Staff
                  </TabsTrigger>
                  <TabsTrigger value="followups">
                    <Send className="w-4 h-4 mr-1" /> Follow-ups
                  </TabsTrigger>
                  <TabsTrigger value="gallery">
                    <Image className="w-4 h-4 mr-1" /> Gallery
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  {businessId ? (
                    <AnalyticsDashboard businessId={businessId} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to view analytics</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bookings">
                  <div className="p-8 bg-card rounded-2xl border border-border text-center">
                    <p className="text-muted-foreground">Detailed booking analytics coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="bundles">
                  {businessId ? (
                    <BundleManager businessId={businessId} services={businessServices} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage bundles</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="loyalty">
                  {businessId ? (
                    <LoyaltyManager businessId={businessId} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage your loyalty program</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="revenue">
                  <div className="p-8 bg-card rounded-2xl border border-border text-center">
                    <p className="text-muted-foreground">Detailed revenue analytics coming soon</p>
                  </div>
                </TabsContent>

                <TabsContent value="clients">
                  {businessId ? (
                    <ClientNotesManager businessId={businessId} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage clients</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="waitlist">
                  {businessId ? (
                    <BusinessWaitlistManager businessId={businessId} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage your waitlist</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="staff">
                  {businessId ? (
                    <StaffManager businessId={businessId} services={businessServices} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage staff</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="followups">
                  {businessId ? (
                    <FollowupManager businessId={businessId} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage follow-ups</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="gallery">
                  {businessId ? (
                    <GalleryManager businessId={businessId} services={businessServices} />
                  ) : (
                    <div className="p-8 bg-card rounded-2xl border border-border text-center">
                      <p className="text-muted-foreground">Set up your business profile to manage your gallery</p>
                    </div>
                  )}
                </TabsContent>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessAnalyticsPage;
