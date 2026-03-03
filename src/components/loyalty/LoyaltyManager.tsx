import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, Settings, Users, TrendingUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LoyaltyManagerProps {
  businessId: string;
}

interface LoyaltyProgram {
  id: string;
  business_id: string;
  points_per_dollar: number;
  redemption_rate: number;
  min_redemption_points: number;
  is_active: boolean;
}

interface LoyaltyStats {
  totalMembers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
}

export const LoyaltyManager = ({ businessId }: LoyaltyManagerProps) => {
  const { toast } = useToast();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [stats, setStats] = useState<LoyaltyStats>({ totalMembers: 0, totalPointsIssued: 0, totalPointsRedeemed: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [pointsPerDollar, setPointsPerDollar] = useState(1);
  const [redemptionRate, setRedemptionRate] = useState(0.01);
  const [minRedemption, setMinRedemption] = useState(100);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchProgram();
  }, [businessId]);

  const fetchProgram = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('business_id', businessId)
        .maybeSingle();

      if (data) {
        const p = data as unknown as LoyaltyProgram;
        setProgram(p);
        setPointsPerDollar(p.points_per_dollar);
        setRedemptionRate(p.redemption_rate);
        setMinRedemption(p.min_redemption_points);
        setIsActive(p.is_active);
      }

      // Fetch stats
      const [membersRes, txRes] = await Promise.all([
        supabase
          .from('user_loyalty_points')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId),
        supabase
          .from('points_transactions')
          .select('transaction_type, points')
          .eq('business_id', businessId),
      ]);

      const txData = (txRes.data || []) as { transaction_type: string; points: number }[];
      const issued = txData.filter(t => t.transaction_type === 'earned').reduce((sum, t) => sum + t.points, 0);
      const redeemed = Math.abs(txData.filter(t => t.transaction_type === 'redeemed').reduce((sum, t) => sum + t.points, 0));

      setStats({
        totalMembers: membersRes.count || 0,
        totalPointsIssued: issued,
        totalPointsRedeemed: redeemed,
      });
    } catch (err) {
      console.error('Error fetching loyalty program:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (program) {
        const { error } = await supabase
          .from('loyalty_programs')
          .update({
            points_per_dollar: pointsPerDollar,
            redemption_rate: redemptionRate,
            min_redemption_points: minRedemption,
            is_active: isActive,
          })
          .eq('id', program.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_programs')
          .insert({
            business_id: businessId,
            points_per_dollar: pointsPerDollar,
            redemption_rate: redemptionRate,
            min_redemption_points: minRedemption,
            is_active: isActive,
          });
        if (error) throw error;
      }

      toast({ title: program ? 'Loyalty program updated' : 'Loyalty program created!' });
      await fetchProgram();
    } catch (err: any) {
      toast({ title: 'Failed to save', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Star className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  // Example calculation for preview
  const exampleSpend = 50;
  const examplePoints = Math.floor(exampleSpend * pointsPerDollar);
  const exampleValue = examplePoints * redemptionRate;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {program && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMembers}</p>
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPointsIssued.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points Issued</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPointsRedeemed.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Points Redeemed</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {program ? 'Loyalty Program Settings' : 'Create Loyalty Program'}
          </CardTitle>
          <CardDescription>
            {program
              ? 'Configure how clients earn and redeem points at your business'
              : 'Reward your repeat clients with a points-based loyalty program'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Program Active</Label>
              <p className="text-xs text-muted-foreground">Clients can see and earn points when active</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {/* Points Per Dollar */}
          <div className="space-y-2">
            <Label>Points earned per $1 spent</Label>
            <Select value={String(pointsPerDollar)} onValueChange={v => setPointsPerDollar(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">0.5 points</SelectItem>
                <SelectItem value="1">1 point</SelectItem>
                <SelectItem value="2">2 points</SelectItem>
                <SelectItem value="5">5 points</SelectItem>
                <SelectItem value="10">10 points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Redemption Rate */}
          <div className="space-y-2">
            <Label>Point value ($ per point)</Label>
            <Select value={String(redemptionRate)} onValueChange={v => setRedemptionRate(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.005">$0.005 (200 pts = $1)</SelectItem>
                <SelectItem value="0.01">$0.01 (100 pts = $1)</SelectItem>
                <SelectItem value="0.02">$0.02 (50 pts = $1)</SelectItem>
                <SelectItem value="0.05">$0.05 (20 pts = $1)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Min Redemption */}
          <div className="space-y-2">
            <Label>Minimum points to redeem</Label>
            <Input
              type="number"
              value={minRedemption}
              onChange={e => setMinRedemption(Number(e.target.value))}
              min={10}
              step={10}
            />
          </div>

          {/* Preview */}
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-2">Preview</p>
              <p className="text-xs text-muted-foreground">
                A client spending <span className="font-semibold text-foreground">${exampleSpend}</span> earns{' '}
                <span className="font-semibold text-primary">{examplePoints} points</span>, worth{' '}
                <span className="font-semibold text-primary">${exampleValue.toFixed(2)}</span> in discounts.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                They can redeem after reaching <span className="font-semibold text-foreground">{minRedemption} points</span>{' '}
                (${(minRedemption * redemptionRate).toFixed(2)} minimum discount).
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-gradient-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : program ? 'Save Changes' : 'Create Loyalty Program'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
