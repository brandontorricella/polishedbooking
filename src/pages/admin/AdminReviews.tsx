import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Trash2, Flag } from 'lucide-react';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'flagged' | 'all' | 'removed'>('flagged');
  const { toast } = useToast();

  useEffect(() => { fetchReviews(); }, [filter]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(50);

    if (filter === 'flagged') query = query.eq('is_flagged', true).eq('is_removed', false);
    if (filter === 'removed') query = query.eq('is_removed', true);

    const { data: reviewsData } = await query;
    if (!reviewsData) { setReviews([]); setLoading(false); return; }

    // Fetch related profiles and businesses
    const clientIds = [...new Set(reviewsData.map(r => r.client_id))];
    const businessIds = [...new Set(reviewsData.map(r => r.business_id))];

    const [{ data: profiles }, { data: businesses }] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, email').in('user_id', clientIds),
      supabase.from('businesses').select('id, name').in('id', businessIds),
    ]);

    const enriched = reviewsData.map(r => ({
      ...r,
      client: profiles?.find(p => p.user_id === r.client_id),
      business: businesses?.find(b => b.id === r.business_id),
    }));

    setReviews(enriched);
    setLoading(false);
  }

  async function handleApprove(id: string) {
    await supabase.from('reviews').update({ is_flagged: false, is_resolved: true }).eq('id', id);
    toast({ title: 'Review approved' });
    fetchReviews();
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this review permanently from display?')) return;
    await supabase.from('reviews').update({ is_removed: true, is_resolved: true }).eq('id', id);
    toast({ title: 'Review removed', variant: 'destructive' });
    fetchReviews();
  }

  async function handleRestore(id: string) {
    await supabase.from('reviews').update({ is_removed: false, is_flagged: false, is_resolved: true }).eq('id', id);
    toast({ title: 'Review restored' });
    fetchReviews();
  }

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: 'flagged', label: 'Flagged' },
    { key: 'all', label: 'All' },
    { key: 'removed', label: 'Removed' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Review Moderation</h1>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? '' : 'text-cream/50 hover:text-cream'}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse w-6 h-6 rounded-full bg-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
          <CardContent className="py-12 text-center">
            <p className="text-cream/40">✅ No {filter} reviews</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-amber-400 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                      <span className="text-sm text-cream">{r.client?.display_name || 'Anonymous'}</span>
                      <span className="text-xs text-cream/30">→</span>
                      <span className="text-sm text-primary">{r.business?.name || 'Unknown'}</span>
                      <span className="text-xs text-cream/30">{new Date(r.created_at).toLocaleDateString()}</span>
                      {r.is_flagged && <Badge variant="destructive" className="text-xs"><Flag className="w-3 h-3 mr-1" />Flagged</Badge>}
                      {r.is_removed && <Badge variant="secondary" className="text-xs">Removed</Badge>}
                    </div>
                    <p className="text-sm text-cream/70 mt-1">{r.text || <em className="text-cream/30">No comment</em>}</p>
                    {r.flag_reason && (
                      <p className="text-xs text-amber-400/70 mt-2">Flag reason: {r.flag_reason}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {r.is_removed ? (
                      <Button variant="ghost" size="sm" onClick={() => handleRestore(r.id)} className="text-green-400 hover:text-green-300 h-8">
                        Restore
                      </Button>
                    ) : (
                      <>
                        {r.is_flagged && (
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(r.id)} className="text-green-400 hover:text-green-300 h-8">
                            <CheckCircle className="w-4 h-4 mr-1" />Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(r.id)} className="text-destructive hover:text-destructive h-8">
                          <Trash2 className="w-4 h-4 mr-1" />Remove
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
