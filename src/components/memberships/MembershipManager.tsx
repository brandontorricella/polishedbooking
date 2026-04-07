import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gem, Plus, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemberships, type BusinessMembership } from '@/hooks/useMemberships';

export function MembershipManager() {
  const { memberships, clientMemberships, loading, createMembership, updateMembership, cancelClientMembership } = useMemberships();
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('plans');

  const activeMembers = clientMemberships.filter(m => m.status === 'active');
  const monthlyRevenue = activeMembers.reduce((sum, m) => sum + (m.membership?.price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gem className="w-6 h-6 text-primary" /> Memberships
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Offer recurring membership plans to your most loyal clients
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary gap-1.5">
          <Plus className="w-4 h-4" /> Create Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="w-5 h-5 mx-auto text-primary mb-1" />
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <div className="text-xs text-muted-foreground">Active Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold">${monthlyRevenue.toFixed(0)}/mo</div>
            <div className="text-xs text-muted-foreground">Recurring Revenue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Gem className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-2xl font-bold">{memberships.filter(m => m.is_active).length}</div>
            <div className="text-xs text-muted-foreground">Active Plans</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">Membership Plans</TabsTrigger>
          <TabsTrigger value="members">Active Members ({activeMembers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : memberships.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gem className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold text-lg mb-1">No membership plans yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Create a recurring membership to build predictable revenue</p>
                <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary">Create Plan</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memberships.map(m => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{m.name}</CardTitle>
                        <Badge variant={m.is_active ? 'default' : 'secondary'}>
                          {m.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">${m.price.toFixed(2)}</span>
                        <span className="text-muted-foreground text-sm">/{m.billing_interval === 'weekly' ? 'week' : 'month'}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {m.sessions_per_period ? `${m.sessions_per_period} sessions per period` : 'Unlimited sessions'}
                      </div>
                      {m.perks && m.perks.length > 0 && (
                        <div className="space-y-1">
                          {m.perks.map((perk, i) => (
                            <div key={i} className="text-sm flex items-center gap-1.5">
                              <span className="text-primary">✓</span> {perk}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => updateMembership(m.id, { is_active: !m.is_active })}>
                          {m.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          {clientMemberships.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No active members yet. Share your plans with clients!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {clientMemberships.map(cm => (
                <Card key={cm.id}>
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{cm.membership?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Sessions used: {cm.sessions_used_this_period} / {cm.membership?.sessions_per_period || '∞'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={cm.status === 'active' ? 'default' : 'secondary'}>{cm.status}</Badge>
                      {cm.status === 'active' && (
                        <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                          if (confirm("Cancel this client's membership?")) cancelClientMembership(cm.id);
                        }}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Modal */}
      <MembershipFormDialog open={showCreate} onClose={() => setShowCreate(false)} onSave={async (data) => {
        await createMembership(data);
        setShowCreate(false);
      }} />
    </div>
  );
}

function MembershipFormDialog({ open, onClose, onSave }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    billing_interval: 'monthly',
    price: '',
    sessions_per_period: '',
    perks: [''],
    service_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const addPerk = () => setForm({ ...form, perks: [...form.perks, ''] });
  const updatePerk = (i: number, v: string) => {
    const updated = [...form.perks]; updated[i] = v;
    setForm({ ...form, perks: updated });
  };
  const removePerk = (i: number) => setForm({ ...form, perks: form.perks.filter((_, idx) => idx !== i) });

  const handleSubmit = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    await onSave({
      name: form.name,
      description: form.description || null,
      billing_interval: form.billing_interval,
      price: parseFloat(form.price),
      sessions_per_period: form.sessions_per_period ? parseInt(form.sessions_per_period) : null,
      perks: form.perks.filter(p => p.trim()),
      service_ids: form.service_ids,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💎 Create Membership Plan</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Plan Name *</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Monthly Wellness Plan" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's included..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Billing Interval *</label>
              <Select value={form.billing_interval} onValueChange={v => setForm({ ...form, billing_interval: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Price *</label>
              <Input type="number" min={1} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Sessions Per Period</label>
            <p className="text-xs text-muted-foreground mb-1">Leave blank for unlimited</p>
            <Input type="number" min={1} value={form.sessions_per_period} onChange={e => setForm({ ...form, sessions_per_period: e.target.value })} placeholder="e.g. 4" />
          </div>
          <div>
            <label className="text-sm font-medium">Member Perks</label>
            <p className="text-xs text-muted-foreground mb-2">Additional benefits members receive</p>
            {form.perks.map((perk, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input value={perk} onChange={e => updatePerk(i, e.target.value)} placeholder="e.g. Priority booking" className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removePerk(i)} className="text-destructive px-2">✕</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addPerk} className="w-full border-dashed text-primary">+ Add Perk</Button>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name || !form.price} className="bg-gradient-primary">
              {saving ? 'Creating...' : 'Create Membership'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
