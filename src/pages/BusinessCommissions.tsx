import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Loader2, Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';

interface CommissionRecord {
  id: string;
  staff_id: string;
  booking_id: string;
  service_price: number;
  tip_amount: number;
  commission_type: string;
  commission_rate: number;
  commission_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  staff_name?: string;
}

interface StaffSummary {
  staff_id: string;
  staff_name: string;
  commission_type: string;
  commission_rate: number;
  booking_count: number;
  total_commission: number;
  total_tips: number;
  paid_amount: number;
  unpaid_amount: number;
}

const BusinessCommissions = () => {
  const { businessId } = useAccountType();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffFilter, setStaffFilter] = useState('all');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    // Fetch staff
    const { data: staff } = await supabase
      .from('staff_members')
      .select('id, name')
      .eq('business_id', businessId)
      .eq('is_active', true);
    setStaffList(staff || []);

    // Fetch commissions
    let query = supabase
      .from('staff_commissions')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)
      .order('created_at', { ascending: false });

    if (staffFilter !== 'all') {
      query = query.eq('staff_id', staffFilter);
    }

    const { data, error } = await query;
    if (error) { console.error(error); setLoading(false); return; }

    // Map staff names
    const staffMap: Record<string, string> = {};
    (staff || []).forEach(s => { staffMap[s.id] = s.name; });

    setCommissions((data || []).map(c => ({
      ...c,
      service_price: Number(c.service_price),
      tip_amount: Number(c.tip_amount),
      commission_rate: Number(c.commission_rate),
      commission_amount: Number(c.commission_amount),
      staff_name: staffMap[c.staff_id] || 'Unknown',
    })));
    setLoading(false);
  }, [businessId, startDate, endDate, staffFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkPaid = async (staffId: string) => {
    if (!businessId) return;
    const { error } = await supabase
      .from('staff_commissions')
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq('business_id', businessId)
      .eq('staff_id', staffId)
      .eq('is_paid', false)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (error) { toast.error(error.message); return; }
    toast.success('Commissions marked as paid');
    fetchData();
  };

  // Aggregate by staff
  const byStaff: Record<string, StaffSummary> = {};
  commissions.forEach(c => {
    if (!byStaff[c.staff_id]) {
      byStaff[c.staff_id] = {
        staff_id: c.staff_id,
        staff_name: c.staff_name || 'Unknown',
        commission_type: c.commission_type,
        commission_rate: c.commission_rate,
        booking_count: 0,
        total_commission: 0,
        total_tips: 0,
        paid_amount: 0,
        unpaid_amount: 0,
      };
    }
    byStaff[c.staff_id].booking_count++;
    byStaff[c.staff_id].total_commission += c.commission_amount;
    byStaff[c.staff_id].total_tips += c.tip_amount;
    if (c.is_paid) byStaff[c.staff_id].paid_amount += c.commission_amount;
    else byStaff[c.staff_id].unpaid_amount += c.commission_amount;
  });

  const totals = commissions.reduce((acc, c) => ({
    total: acc.total + c.commission_amount,
    paid: acc.paid + (c.is_paid ? c.commission_amount : 0),
    unpaid: acc.unpaid + (!c.is_paid ? c.commission_amount : 0),
  }), { total: 0, paid: 0, unpaid: 0 });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-5xl">
        <FeatureGate feature="staff_commission_tracking">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-primary" /> Staff Commissions
            </h1>
            <p className="text-muted-foreground">Track and manage staff earnings</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-auto" />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-auto" />
            </div>
            <div>
              <Label className="text-xs">Staff</Label>
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Commissions</p>
                  <p className="text-2xl font-bold">${totals.total.toFixed(2)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-green-600">${totals.paid.toFixed(2)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Unpaid</p>
                  <p className="text-2xl font-bold text-orange-600">${totals.unpaid.toFixed(2)}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">Bookings</p>
                  <p className="text-2xl font-bold">{commissions.length}</p>
                </CardContent></Card>
              </div>

              {/* By Staff */}
              {Object.keys(byStaff).length > 0 && (
                <Card className="mb-6">
                  <CardHeader><CardTitle className="text-base">By Staff Member</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Unpaid</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.values(byStaff).map(row => (
                          <TableRow key={row.staff_id}>
                            <TableCell>
                              <div className="font-semibold">{row.staff_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {row.commission_type === 'percentage' ? `${row.commission_rate}%` : `$${row.commission_rate} flat`}
                              </div>
                            </TableCell>
                            <TableCell>{row.booking_count}</TableCell>
                            <TableCell className="font-semibold">${row.total_commission.toFixed(2)}</TableCell>
                            <TableCell className="text-green-600">${row.paid_amount.toFixed(2)}</TableCell>
                            <TableCell className="text-orange-600">${row.unpaid_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                {row.commission_type === 'percentage' ? `${row.commission_rate}%` : `$${row.commission_rate}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {row.unpaid_amount > 0 && (
                                <Button size="sm" variant="outline" onClick={() => handleMarkPaid(row.staff_id)}>
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Commission Log */}
              <Card>
                <CardHeader><CardTitle className="text-base">Commission Log</CardTitle></CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No commission records for this period.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Service Price</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Commission</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map(c => (
                          <TableRow key={c.id}>
                            <TableCell className="text-sm">{format(new Date(c.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{c.staff_name}</TableCell>
                            <TableCell>${c.service_price.toFixed(2)}</TableCell>
                            <TableCell>${c.tip_amount.toFixed(2)}</TableCell>
                            <TableCell className="font-semibold">${c.commission_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge className={c.is_paid ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}>
                                {c.is_paid ? 'Paid' : 'Unpaid'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </FeatureGate>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default BusinessCommissions;
