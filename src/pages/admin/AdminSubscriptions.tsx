import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AdminSubscriptions() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchData(); }, [filter]);

  async function fetchData() {
    setLoading(true);
    let query = supabase.from('businesses')
      .select('id, name, email, subscription_tier, subscription_status, trial_ends_at, subscription_ends_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filter !== 'all') {
      query = query.eq('subscription_status', filter);
    }

    const { data } = await query;
    setBusinesses(data || []);
    setLoading(false);
  }

  const filters = ['all', 'active', 'trialing', 'past_due', 'canceled'];

  const statusColor = (s: string) => {
    switch (s) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'trialing': return 'bg-blue-500/20 text-blue-400';
      case 'past_due': return 'bg-red-500/20 text-red-400';
      case 'canceled': return 'bg-cream/10 text-cream/40';
      default: return 'bg-cream/10 text-cream/40';
    }
  };

  const tierMrr = (tier: string | null) => {
    if (tier === 'elite') return 99;
    if (tier === 'pro') return 59;
    return 29;
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Subscriptions</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? '' : 'text-cream/50 hover:text-cream'}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </Button>
        ))}
      </div>

      <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0,0%,15%)] hover:bg-transparent">
                <TableHead className="text-cream/50">Business</TableHead>
                <TableHead className="text-cream/50">Tier</TableHead>
                <TableHead className="text-cream/50">Status</TableHead>
                <TableHead className="text-cream/50">MRR</TableHead>
                <TableHead className="text-cream/50">Trial/Billing End</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-cream/40 py-8">Loading...</TableCell></TableRow>
              ) : businesses.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-cream/40 py-8">No subscriptions found</TableCell></TableRow>
              ) : businesses.map((b) => (
                <TableRow key={b.id} className="border-[hsl(0,0%,15%)]">
                  <TableCell>
                    <p className="text-sm font-medium text-cream">{b.name}</p>
                    <p className="text-xs text-cream/40">{b.email}</p>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      b.subscription_tier === 'elite' ? 'bg-yellow-500/20 text-yellow-400' :
                      b.subscription_tier === 'pro' ? 'bg-primary/20 text-primary' :
                      'bg-cream/10 text-cream/50'
                    }`}>
                      {b.subscription_tier || 'basic'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(b.subscription_status || '')}`}>
                      {b.subscription_status || 'unknown'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-cream/70">${tierMrr(b.subscription_tier)}</TableCell>
                  <TableCell className="text-sm text-cream/50">
                    {b.subscription_status === 'trialing' && b.trial_ends_at
                      ? new Date(b.trial_ends_at).toLocaleDateString()
                      : b.subscription_ends_at
                      ? new Date(b.subscription_ends_at).toLocaleDateString()
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
