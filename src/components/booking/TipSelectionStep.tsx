import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Business, Service } from '@/types';

interface TipSelectionStepProps {
  business: Business;
  service: Service;
  onTipSelected: (amount: number) => void;
  onSkip: () => void;
}

export const TipSelectionStep = ({ business, service, onTipSelected, onSkip }: TipSelectionStepProps) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const businessAny = business as any;
  const presets: number[] = businessAny.tip_presets || [15, 20, 25];

  const tipAmount = useCustom
    ? (parseFloat(customAmount) || 0)
    : selectedPreset !== null
      ? parseFloat(((service.price * selectedPreset) / 100).toFixed(2))
      : 0;

  const handlePresetSelect = (pct: number) => {
    setUseCustom(false);
    setSelectedPreset(pct);
    setCustomAmount('');
  };

  return (
    <motion.div
      key="tip"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="text-center">
        <div className="text-4xl mb-2">💝</div>
        <h3 className="font-display text-lg font-semibold">Add a Tip?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Show your appreciation for {business.name}. 100% goes to your provider.
        </p>
      </div>

      {/* Service summary */}
      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50 text-sm">
        <span className="font-medium">{service.name}</span>
        <span className="font-semibold">${service.price.toFixed(2)}</span>
      </div>

      {/* Preset buttons */}
      <div className="grid grid-cols-4 gap-2">
        {presets.map((pct) => {
          const amt = ((service.price * pct) / 100).toFixed(2);
          return (
            <button
              key={pct}
              onClick={() => handlePresetSelect(pct)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer",
                selectedPreset === pct && !useCustom
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className={cn("text-base font-bold", selectedPreset === pct && !useCustom && "text-primary")}>
                {pct}%
              </span>
              <span className="text-xs text-muted-foreground">${amt}</span>
            </button>
          );
        })}
        <button
          onClick={() => { setUseCustom(true); setSelectedPreset(null); }}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer",
            useCustom
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <span className={cn("text-base font-bold", useCustom && "text-primary")}>Custom</span>
          <span className="text-xs text-muted-foreground">$</span>
        </button>
      </div>

      {/* Custom input */}
      {useCustom && (
        <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-primary bg-primary/5">
          <span className="text-lg font-bold text-primary">$</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="0.00"
            autoFocus
            className="border-0 bg-transparent text-xl font-bold text-center focus-visible:ring-0"
          />
        </div>
      )}

      {/* Total preview */}
      {tipAmount > 0 && (
        <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service</span>
            <span>${service.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-primary font-medium">
            <span>Tip ({useCustom ? 'Custom' : `${selectedPreset}%`})</span>
            <span>+${tipAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border font-semibold text-base">
            <span>Total</span>
            <span>${(service.price + tipAmount).toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => onTipSelected(tipAmount)}
          disabled={tipAmount <= 0}
          className="w-full bg-gradient-primary"
        >
          <Heart className="w-4 h-4 mr-2" />
          {tipAmount > 0 ? `Add $${tipAmount.toFixed(2)} Tip` : 'Select a tip amount'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
          No tip this time
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        💝 Tips are optional and always appreciated
      </p>
    </motion.div>
  );
};
