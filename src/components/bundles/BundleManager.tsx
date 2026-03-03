import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Sparkles, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useManageBundles } from '@/hooks/useServiceBundles';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface BundleManagerProps {
  businessId: string;
  services: Service[];
}

export const BundleManager = ({ businessId, services }: BundleManagerProps) => {
  const { bundles, loading, createBundle, deleteBundle } = useManageBundles(businessId);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Service Bundles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Create packages to offer discounted bundled services</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> Create Bundle
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Sparkles className="w-6 h-6 animate-pulse text-primary" />
        </div>
      ) : bundles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No bundles yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create service bundles to offer your clients package deals</p>
            <Button variant="outline" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Bundle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bundles.map(bundle => (
            <Card key={bundle.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{bundle.name}</h3>
                      {bundle.discount_amount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {bundle.discount_type === 'percentage'
                            ? `${bundle.discount_value}% off`
                            : `$${bundle.discount_value} off`}
                        </Badge>
                      )}
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bundle.items.map(item => (
                        <Badge key={item.id} variant="outline" className="text-xs">
                          {item.service.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm mt-2">
                      <span className="text-muted-foreground">{bundle.total_duration} min</span>
                      {bundle.discount_amount > 0 && (
                        <span className="line-through text-muted-foreground ml-2">${bundle.original_total.toFixed(2)}</span>
                      )}
                      <span className="font-semibold ml-2">${bundle.final_total.toFixed(2)}</span>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteBundle(bundle.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateBundleDialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        services={services}
        onSave={async (data) => {
          const ok = await createBundle(data);
          if (ok) setShowCreate(false);
        }}
      />
    </div>
  );
};

function CreateBundleDialog({
  isOpen,
  onClose,
  services,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onSave: (data: { name: string; description: string; discount_type: string; discount_value: number; service_ids: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [saving, setSaving] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const originalTotal = selectedServiceIds.reduce((sum, id) => {
    const s = services.find(sv => sv.id === id);
    return sum + (s?.price || 0);
  }, 0);

  const discountAmount = discountType === 'percentage'
    ? originalTotal * (discountValue / 100)
    : Math.min(discountValue, originalTotal);

  const finalTotal = Math.max(0, originalTotal - discountAmount);

  const totalDuration = selectedServiceIds.reduce((sum, id) => {
    const s = services.find(sv => sv.id === id);
    return sum + (s?.duration || 0);
  }, 0);

  const handleSubmit = async () => {
    setSaving(true);
    await onSave({ name, description, discount_type: discountType, discount_value: discountValue, service_ids: selectedServiceIds });
    setSaving(false);
    // Reset
    setName('');
    setDescription('');
    setSelectedServiceIds([]);
    setDiscountValue(10);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Create Service Bundle</DialogTitle>
          <DialogDescription>Combine services into a discounted package</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1 block">Bundle Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Bridal Package, Full Glam"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what's included..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Services (min 2)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-xl p-3">
              {services.map(service => (
                <label
                  key={service.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedServiceIds.includes(service.id)}
                    onCheckedChange={() => toggleService(service.id)}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{service.name}</span>
                    <span className="text-xs text-muted-foreground">${service.price} • {service.duration} min</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Discount</label>
            <div className="flex items-center gap-3">
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed ($)</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Slider
                  value={[discountValue]}
                  onValueChange={([v]) => setDiscountValue(v)}
                  min={0}
                  max={discountType === 'percentage' ? 50 : originalTotal}
                  step={discountType === 'percentage' ? 5 : 5}
                />
              </div>
              <span className="text-sm font-medium w-16 text-right">
                {discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}
              </span>
            </div>
          </div>

          {selectedServiceIds.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-muted/50 space-y-2"
            >
              <h4 className="font-semibold text-sm">Bundle Preview</h4>
              <div className="flex justify-between text-sm">
                <span>Original</span>
                <span>${originalTotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Discount</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-border pt-2">
                <span>Final Price</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Total duration: {totalDuration} min</div>
            </motion.div>
          )}

          <Button
            className="w-full bg-gradient-primary hover:opacity-90"
            onClick={handleSubmit}
            disabled={selectedServiceIds.length < 2 || !name.trim() || saving}
          >
            {saving ? 'Creating...' : 'Create Bundle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
