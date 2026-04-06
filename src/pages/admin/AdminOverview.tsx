import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, CalendarDays, DollarSign, Star, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  totalBusinesses: number;
  totalUsers: number;
  totalBookings: number;
  totalReviews: number;
  flaggedReviews: number;
  eliteCount: number;
  proCount: number;
  basicCount: number;
  mrr: number;
  recentBusinesses: any[];
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const [
      { count: totalBusinesses },
      { count: totalUsers },
      { count: totalBookings },
      { count: totalReviews },
      { count: flaggedReviews },
      { data: businesses },
      { data: recentBusinesses },
    ] = await Promise.all([
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_flagged', true).eq('is_resolved', false),
      supabase.from('businesses').select('subscription_tier'),
      supabase.from('businesses').select('id, name, subscription_tier, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const eliteCount = businesses?.filter(b => b.subscription_tier === 'elite').length || 0;
    const proCount = businesses?.filter(b => b.subscription_tier === 'pro').length || 0;
    const basicCount = businesses?.filter(b => b.subscription_tier === 'basic').length || 0;

    setStats({
      totalBusinesses: totalBusinesses || 0,
      totalUsers: totalUsers || 0,
      totalBookings: totalBookings || 0,
      totalReviews: totalReviews || 0,
      flaggedReviews: flaggedReviews || 0,
      eliteCount,
      proCount,
      basicCount,
      mrr: (eliteCount * 99) + (proCount * 59) + (basicCount * 29),
      recentBusinesses: recentBusinesses || [],
    });
    setLoading(false);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse w-8 h-8 rounded-full bg-primary" />
        </div>
      </AdminLayout>
    );
  }

  const kpis = [
    { icon: Building2, label: 'Businesses', value: stats!.totalBusinesses, color: 'text-primary' },
    { icon: Users, label: 'Users', value: stats!.totalUsers, color: 'text-blue-400' },
    { icon: CalendarDays, label: 'Bookings', value: stats!.totalBookings, color: 'text-green-400' },
    { icon: DollarSign, label: 'Est. MRR', value: `$${stats!.mrr}`, color: 'text-yellow-400' },
    { icon: Star, label: 'Reviews', value: stats!.totalReviews, color: 'text-amber-400' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Platform Overview</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                <div>
                  <p className="text-xl font-bold text-cream">{kpi.value}</p>
                  <p className="text-xs text-cream/50">{kpi.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Subscription Breakdown */}
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader>
            <CardTitle className="text-cream text-base">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Elite', count: stats!.eliteCount, color: 'bg-yellow-500' },
              { label: 'Pro', count: stats!.proCount, color: 'bg-primary' },
              { label: 'Basic', count: stats!.basicCount, color: 'bg-cream/30' },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-3">
                <span className="text-sm text-cream/70 w-12">{tier.label}</span>
                <div className="flex-1 h-2 bg-cream/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${tier.color} rounded-full`}
                    style={{ width: `${stats!.totalBusinesses > 0 ? (tier.count / stats!.totalBusinesses) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-cream/50 w-6 text-right">{tier.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader>
            <CardTitle className="text-cream text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats!.flaggedReviews > 0 ? (
              <Link
                to="/admin/reviews"
                className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
              >
                <span className="text-sm text-amber-300">{stats!.flaggedReviews} flagged review(s) need moderation</span>
                <span className="text-xs text-amber-400">View →</span>
              </Link>
            ) : (
              <p className="text-sm text-cream/40 p-3">✅ No issues — everything looks good!</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Businesses */}
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)] md:col-span-2">
          <CardHeader>
            <CardTitle className="text-cream text-base">Recent Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats!.recentBusinesses.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-cream/5">
                  <div>
                    <p className="text-sm font-medium text-cream">{b.name}</p>
                    <p className="text-xs text-cream/40">{new Date(b.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    b.subscription_tier === 'elite' ? 'bg-yellow-500/20 text-yellow-400' :
                    b.subscription_tier === 'pro' ? 'bg-primary/20 text-primary' :
                    'bg-cream/10 text-cream/50'
                  }`}>
                    {b.subscription_tier || 'basic'}
                  </span>
                </div>
              ))}
              {stats!.recentBusinesses.length === 0 && (
                <p className="text-sm text-cream/40">No businesses yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
