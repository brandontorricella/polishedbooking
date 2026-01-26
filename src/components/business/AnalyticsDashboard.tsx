import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { AnalyticsData } from '@/types';
import { cn } from '@/lib/utils';

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  className?: string;
}

const StatCard = ({ title, value, change, icon, className }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className={cn("p-6 bg-card rounded-2xl border border-border", className)}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-display font-bold mt-1">{value}</p>
        {typeof change === 'number' && (
          <div className={cn(
            "flex items-center gap-1 mt-2 text-sm",
            change >= 0 ? "text-green-600" : "text-destructive"
          )}>
            {change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{Math.abs(change)}% vs last month</span>
          </div>
        )}
      </div>
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  </motion.div>
);

export const AnalyticsDashboard = ({ data }: AnalyticsDashboardProps) => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Bookings"
          value={data.totalBookings}
          change={12}
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString()}`}
          change={8}
          icon={<DollarSign className="w-6 h-6" />}
        />
        <StatCard
          title="New Clients"
          value={data.newClients}
          change={24}
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Returning Clients"
          value={data.returningClients}
          change={-5}
          icon={<TrendingUp className="w-6 h-6" />}
        />
        <StatCard
          title="Avg. Rating"
          value={data.averageRating.toFixed(1)}
          icon={<Star className="w-6 h-6" />}
        />
        <StatCard
          title="Profile Views"
          value={data.viewsThisMonth.toLocaleString()}
          change={32}
          icon={<Eye className="w-6 h-6" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueByMonth}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(15 55% 55%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(15 55% 55%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 20% 88%)" />
                  <XAxis dataKey="month" stroke="hsl(20 10% 45%)" fontSize={12} />
                  <YAxis stroke="hsl(20 10% 45%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(30 20% 88%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(15 55% 55%)" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Chart */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Bookings This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bookingsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 20% 88%)" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(20 10% 45%)" 
                    fontSize={12}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en', { weekday: 'short' })}
                  />
                  <YAxis stroke="hsl(20 10% 45%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(0 0% 100%)', 
                      border: '1px solid hsl(30 20% 88%)',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'Bookings']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(38 70% 55%)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services & Client Retention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topServices.map((service, index) => (
                <div key={service.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{service.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(service.bookings / data.topServices[0].bookings) * 100}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="h-full bg-gradient-primary rounded-full"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{service.bookings} bookings</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-display">Client Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="hsl(40 20% 94%)"
                    strokeWidth="12"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#retentionGradient)"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - data.clientRetentionRate / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="retentionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(15 55% 55%)" />
                      <stop offset="100%" stopColor="hsl(38 70% 55%)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-display font-bold">{data.clientRetentionRate}%</span>
                </div>
              </div>
              <p className="text-muted-foreground mt-4">of clients return for another service</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
