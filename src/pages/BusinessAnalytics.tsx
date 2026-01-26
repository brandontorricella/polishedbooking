import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AnalyticsDashboard } from '@/components/business/AnalyticsDashboard';
import { mockAnalytics } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, Calendar, RefreshCw } from 'lucide-react';

const BusinessAnalyticsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

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
