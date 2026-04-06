import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { fetchBusinesses(); }, [search, tierFilter]);

  async function fetchBusinesses() {
    setLoading(true);
    let query = supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(100);
    if (search) query = query.ilike('name', `%${search}%`);
    if (tierFilter !== 'all') query = query.eq('subscription_tier', tierFilter as any);
    const { data } = await query;
    setBusinesses(data || []);
    setLoading(false);
  }

  async function handleTogglePublish(id: string, current: boolean) {
    await supabase.from('businesses').update({ is_published: !current }).eq('id', id);
    toast({ title: current ? 'Business unpublished' : 'Business published' });
    fetchBusinesses();
  }

  async function handleChangeTier(id: string, tier: string) {
    await supabase.from('businesses').update({ subscription_tier: tier as any }).eq('id', id);
    toast({ title: `Tier updated to ${tier}` });
    fetchBusinesses();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    await supabase.from('businesses').delete().eq('id', id);
    toast({ title: 'Business deleted', variant: 'destructive' });
    fetchBusinesses();
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Businesses</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[hsl(0,0%,10%)] border-[hsl(0,0%,20%)] text-cream placeholder:text-cream/30"
          />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-36 bg-[hsl(0,0%,10%)] border-[hsl(0,0%,20%)] text-cream">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0,0%,15%)] hover:bg-transparent">
                <TableHead className="text-cream/50">Business</TableHead>
                <TableHead className="text-cream/50">Tier</TableHead>
                <TableHead className="text-cream/50">Status</TableHead>
                <TableHead className="text-cream/50">Location</TableHead>
                <TableHead className="text-cream/50">Joined</TableHead>
                <TableHead className="text-cream/50 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-cream/40 py-8">Loading...</TableCell></TableRow>
              ) : businesses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-cream/40 py-8">No businesses found</TableCell></TableRow>
              ) : businesses.map((b) => (
                <TableRow key={b.id} className="border-[hsl(0,0%,15%)]">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-cream">{b.name}</p>
                      <p className="text-xs text-cream/40">{b.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={b.subscription_tier || 'basic'} onValueChange={(v) => handleChangeTier(b.id, v)}>
                      <SelectTrigger className="w-24 h-7 text-xs bg-transparent border-[hsl(0,0%,20%)] text-cream">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="elite">Elite</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.is_published ? 'default' : 'secondary'} className="text-xs">
                      {b.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-cream/60">
                    {[b.city, b.state].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-cream/60">
                    {new Date(b.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="text-xs text-cream/50 hover:text-cream h-7"
                        onClick={() => handleTogglePublish(b.id, b.is_published || false)}
                      >
                        {b.is_published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="text-xs text-destructive hover:text-destructive h-7"
                        onClick={() => handleDelete(b.id, b.name)}
                      >
                        Delete
                      </Button>
                    </div>
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
