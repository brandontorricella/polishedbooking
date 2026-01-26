import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsDashboard } from '@/components/business/AnalyticsDashboard';
import { SubscriptionBanner } from '@/components/subscription/SubscriptionBanner';
import { mockAnalytics } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Calendar, RefreshCw, CreditCard, Crown, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const tierDetails = {
  basic: { name: 'Basic', icon: Sparkles, color: 'text-blue-500' },
  pro: { name: 'Pro', icon: Crown, color: 'text-primary' },
  elite: { name: 'Elite', icon: Crown, color: 'text-amber-500' },
};

const BusinessAnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { subscription, isLoading, checkSubscription, openCustomerPortal, isTrialing, daysRemaining } = useSubscription();

  // Check for success redirect from Stripe
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Payment setup complete!',
        description: 'Your subscription is now active.',
      });
      // Refresh subscription status
      checkSubscription();
    }
  }, [searchParams, toast, checkSubscription]);

  const currentTier = subscription?.tier || 'basic';
  const TierIcon = tierDetails[currentTier]?.icon || Sparkles;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubscriptionBanner />
      
      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Business Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Track your performance and grow your business
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => checkSubscription()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Subscription Card */}
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
                  {subscription?.subscription_end && !isTrialing && (
                    <p className="text-sm text-muted-foreground">
                      Renews on {new Date(subscription.subscription_end).toLocaleDateString()}
                    </p>
                  )}
                  {!subscription?.subscribed && !isTrialing && (
                    <p className="text-sm text-muted-foreground">
                      No active subscription
                    </p>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={openCustomerPortal}
                  disabled={isLoading}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <AnalyticsDashboard data={mockAnalytics} />
            </TabsContent>

            <TabsContent value="bookings">
              <div className="p-8 bg-card rounded-2xl border border-border text-center">
                <p className="text-muted-foreground">Detailed booking analytics coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="revenue">
              <div className="p-8 bg-card rounded-2xl border border-border text-center">
                <p className="text-muted-foreground">Detailed revenue analytics coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="clients">
              <div className="p-8 bg-card rounded-2xl border border-border text-center">
                <p className="text-muted-foreground">Detailed client analytics coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BusinessAnalyticsPage;
