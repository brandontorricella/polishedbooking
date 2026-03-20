import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, TrendingUp, Users, Percent, RotateCcw, Mail, Loader2 } from 'lucide-react';
import { useFollowupSettings, useFollowupStats, FollowupSettings } from '@/hooks/useFollowups';
import { format } from 'date-fns';

interface FollowupManagerProps {
  businessId: string;
}

export function FollowupManager({ businessId }: FollowupManagerProps) {
  const { settings, loading, saving, saveSettings, setSettings } = useFollowupSettings(businessId);
  const { stats, recentLogs, loading: statsLoading } = useFollowupStats(businessId);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const updateField = <K extends keyof FollowupSettings>(key: K, value: FollowupSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Automated Follow-ups</h2>
        <p className="text-muted-foreground">Automatically remind clients to book again</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Send className="w-5 h-5 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold">{stats.totalSent}</p>
            <p className="text-sm text-muted-foreground">Follow-ups Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <RotateCcw className="w-5 h-5 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{stats.totalRebooked}</p>
            <p className="text-sm text-muted-foreground">Rebooked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-bold">{stats.rebookRate}%</p>
            <p className="text-sm text-muted-foreground">Rebook Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Percent className="w-5 h-5 mx-auto mb-2 text-pink-500" />
            <p className="text-3xl font-bold">{stats.discountsUsed}</p>
            <p className="text-sm text-muted-foreground">Discounts Used</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Follow-ups</Label>
              <p className="text-sm text-muted-foreground">Automatically send rebooking reminders</p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(v) => updateField('is_enabled', v)}
            />
          </div>

          <Separator />

          {/* Days After */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Days After Appointment</Label>
              <p className="text-sm text-muted-foreground">Send follow-up X days after their visit</p>
            </div>
            <Select
              value={String(settings.days_after_appointment)}
              onValueChange={(v) => updateField('days_after_appointment', parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="21">21 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="45">45 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-2">
            <div>
              <Label className="text-base font-medium">Message</Label>
              <p className="text-sm text-muted-foreground">
                Use {'{client_name}'}, {'{service_name}'}, {'{business_name}'} to personalize
              </p>
            </div>
            <Textarea
              value={settings.followup_message}
              onChange={(e) => updateField('followup_message', e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Include Discount */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Include Discount</Label>
              <p className="text-sm text-muted-foreground">Offer a discount to encourage rebooking</p>
            </div>
            <Switch
              checked={settings.include_discount}
              onCheckedChange={(v) => updateField('include_discount', v)}
            />
          </div>

          {settings.include_discount && (
            <>
              <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                <Label className="text-base font-medium">Discount Percentage</Label>
                <Select
                  value={String(settings.discount_percent)}
                  onValueChange={(v) => updateField('discount_percent', parseInt(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-primary/20">
                <Label className="text-base font-medium">Discount Valid For</Label>
                <Select
                  value={String(settings.discount_valid_days)}
                  onValueChange={(v) => updateField('discount_valid_days', parseInt(v))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Button
            onClick={() => saveSettings(settings)}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              'Save Settings'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Follow-ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <Send className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No follow-ups sent yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Enable follow-ups and they'll appear here after being sent
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border ${
                    log.rebooked ? 'border-green-500/30 bg-green-500/5' : 'border-border'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{log.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.sent_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {log.rebooked && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                        ✓ Rebooked
                      </Badge>
                    )}
                    {log.discount_used && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        Used Discount
                      </Badge>
                    )}
                    {!log.rebooked && !log.discount_used && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Sent
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
