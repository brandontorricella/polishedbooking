import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, CreditCard, Users } from 'lucide-react';

export default function AdminRevenue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: businesses } = await supabase.from('businesses').select('subscription_tier, subscription_status');
    const { data: transactions } = await supabase.from('payment_transactions').select('amount, type, status, created_at').eq('status', 'succeeded');

    const active = businesses?.filter(b => b.subscription_status === 'active' || b.subscription_status === 'trialing') || [];
    const eliteCount = active.filter(b => b.subscription_tier === 'elite').length;
    const proCount = active.filter(b => b.subscription_tier === 'pro').length;
    const basicCount = active.filter(b => b.subscription_tier === 'basic').length;

    const mrr = (eliteCount * 99) + (proCount * 59) + (basicCount * 29);
    const arr = mrr * 12;
    const totalDeposits = transactions?.filter(t => t.type === 'deposit').reduce((s, t) => s + Number(t.amount), 0) || 0;
    const totalCancFees = transactions?.filter(t => t.type === 'cancellation_fee').reduce((s, t) => s + Number(t.amount), 0) || 0;

    setData({
      mrr,
      arr,
      totalDeposits,
      totalCancFees,
      activeSubscriptions: active.length,
      eliteCount,
      proCount,
      basicCount,
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

  const cards = [
    { icon: DollarSign, label: 'Monthly Recurring Revenue', value: `$${data.mrr}`, color: 'text-green-400' },
    { icon: TrendingUp, label: 'Annual Run Rate', value: `$${data.arr.toLocaleString()}`, color: 'text-blue-400' },
    { icon: CreditCard, label: 'Total Deposits Collected', value: `$${data.totalDeposits.toFixed(2)}`, color: 'text-primary' },
    { icon: Users, label: 'Active Subscriptions', value: data.activeSubscriptions, color: 'text-amber-400' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Revenue</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label} className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
            <CardContent className="p-4">
              <c.icon className={`w-5 h-5 mb-2 ${c.color}`} />
              <p className="text-2xl font-bold text-cream">{c.value}</p>
              <p className="text-xs text-cream/50">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader><CardTitle className="text-cream text-base">Revenue by Tier</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { tier: 'Elite', count: data.eliteCount, price: 99, color: 'bg-yellow-500' },
              { tier: 'Pro', count: data.proCount, price: 59, color: 'bg-primary' },
              { tier: 'Basic', count: data.basicCount, price: 29, color: 'bg-cream/30' },
            ].map((t) => (
              <div key={t.tier} className="flex items-center justify-between p-3 rounded-lg bg-cream/5">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span className="text-sm text-cream">{t.tier}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-cream">${t.count * t.price}/mo</p>
                  <p className="text-xs text-cream/40">{t.count} × ${t.price}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardHeader><CardTitle className="text-cream text-base">Transaction Fees</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-3 rounded-lg bg-cream/5">
              <span className="text-sm text-cream/70">Deposits Collected</span>
              <span className="text-sm font-medium text-cream">${data.totalDeposits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-cream/5">
              <span className="text-sm text-cream/70">Cancellation Fees</span>
              <span className="text-sm font-medium text-cream">${data.totalCancFees.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
