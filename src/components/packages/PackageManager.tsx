import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, Edit, Trash2, ToggleLeft, ToggleRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePackages, type ServicePackage } from '@/hooks/usePackages';

export function PackageManager() {
  const { packages, loading, createPackage, updatePackage, deletePackage } = usePackages();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ServicePackage | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> Service Packages
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Sell prepaid session bundles to your clients at a discount
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary gap-1.5">
          <Plus className="w-4 h-4" /> Create Package
        </Button>
      </div>

      {/* How it works */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border text-sm flex-wrap">
        <span className="flex items-center gap-2"><span className="text-xl">📦</span> Create a bundle</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <span className="flex items-center gap-2"><span className="text-xl">💳</span> Clients purchase upfront</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
        <span className="flex items-center gap-2"><span className="text-xl">📅</span> Sessions deducted as they book</span>
      </div>

      {/* Packages list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : packages.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg mb-1">No packages yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first package to start offering bundled sessions</p>
            <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary">
              Create Your First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const savings = pkg.original_price ? pkg.original_price - pkg.price : 0;
            const savingsPct = pkg.original_price ? Math.round((savings / pkg.original_price) * 100) : 0;
            return (
              <motion.div key={pkg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={!pkg.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{pkg.name}</CardTitle>
                        {!pkg.is_active && <Badge variant="secondary" className="mt-1 text-xs">Inactive</Badge>}
                      </div>
                      {savingsPct > 0 && (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{savingsPct}% off</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Sessions</span><br/><strong>{pkg.session_count}</strong></div>
                      <div><span className="text-muted-foreground">Price</span><br/><strong>${pkg.price.toFixed(2)}</strong></div>
                      {pkg.original_price && (
                        <div><span className="text-muted-foreground">Regular</span><br/><span className="line-through text-muted-foreground">${pkg.original_price.toFixed(2)}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Valid</span><br/><strong>{pkg.validity_days} days</strong></div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(pkg); setShowCreate(true); }}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updatePackage(pkg.id, { is_active: !pkg.is_active })}>
                        {pkg.is_active ? <ToggleRight className="w-3.5 h-3.5 mr-1" /> : <ToggleLeft className="w-3.5 h-3.5 mr-1" />}
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
                        if (confirm('Delete this package?')) deletePackage(pkg.id);
                      }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <PackageFormDialog
        open={showCreate}
        onClose={() => { setShowCreate(false); setEditing(null); }}
        existing={editing}
        onSave={async (data) => {
          if (editing) {
            await updatePackage(editing.id, data);
          } else {
            await createPackage(data as any);
          }
          setShowCreate(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function PackageFormDialog({ open, onClose, existing, onSave }: {
  open: boolean;
  onClose: () => void;
  existing: ServicePackage | null;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    session_count: 5,
    price: '',
    original_price: '',
    validity_days: 365,
    service_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  useState(() => {
    if (existing) {
      setForm({
        name: existing.name,
        description: existing.description || '',
        session_count: existing.session_count,
        price: String(existing.price),
        original_price: existing.original_price ? String(existing.original_price) : '',
        validity_days: existing.validity_days,
        service_ids: existing.service_ids || [],
      });
    }
  });

  const perSession = form.price && form.session_count ? (parseFloat(form.price) / form.session_count).toFixed(2) : null;

  const handleSubmit = async () => {
    if (!form.name || !form.price || form.session_count < 2) return;
    setSaving(true);
    await onSave({
      name: form.name,
      description: form.description || null,
      session_count: form.session_count,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      validity_days: form.validity_days,
      service_ids: form.service_ids,
    });
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Package' : '📦 Create Package'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Package Name *</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 5-Session Massage Bundle" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's included..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Sessions *</label>
              <Input type="number" min={2} max={100} value={form.session_count} onChange={e => setForm({ ...form, session_count: parseInt(e.target.value) || 2 })} />
            </div>
            <div>
              <label className="text-sm font-medium">Valid For</label>
              <Select value={String(form.validity_days)} onValueChange={v => setForm({ ...form, validity_days: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Package Price *</label>
              <Input type="number" min={1} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-sm font-medium">Regular Price</label>
              <Input type="number" min={1} step={0.01} value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} placeholder="Individual cost" />
            </div>
          </div>
          {perSession && (
            <div className="text-sm text-green-600 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              💡 ${perSession} per session
              {form.original_price && ` · Save $${(parseFloat(form.original_price) - parseFloat(form.price)).toFixed(2)} total`}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name || !form.price} className="bg-gradient-primary">
              {saving ? 'Saving...' : existing ? 'Save Changes' : 'Create Package'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
