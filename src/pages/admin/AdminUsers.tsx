import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  useEffect(() => { fetchUsers(); }, [search]);

  async function fetchUsers() {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-display font-bold mb-6">Users</h1>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[hsl(0,0%,10%)] border-[hsl(0,0%,20%)] text-cream placeholder:text-cream/30"
          />
        </div>
      </div>

      <Card className="bg-[hsl(0,0%,10%)] border-[hsl(0,0%,15%)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[hsl(0,0%,15%)] hover:bg-transparent">
                <TableHead className="text-cream/50">User</TableHead>
                <TableHead className="text-cream/50">Role</TableHead>
                <TableHead className="text-cream/50">Location</TableHead>
                <TableHead className="text-cream/50">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-cream/40 py-8">Loading...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-cream/40 py-8">No users found</TableCell></TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} className="border-[hsl(0,0%,15%)]">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-cream">{u.display_name || 'No name'}</p>
                      <p className="text-xs text-cream/40">{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'business' ? 'default' : 'secondary'} className="text-xs">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-cream/60">
                    {[u.location_city, u.location_state].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-cream/60">
                    {new Date(u.created_at).toLocaleDateString()}
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
