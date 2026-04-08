import { useState, useEffect } from 'react';
import { Copy, Check, Link2, Monitor, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = ['#FF69B4', '#000000', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
const SIZE_OPTIONS = [
  { value: 'compact', label: 'Compact', height: 400 },
  { value: 'medium', label: 'Medium', height: 600 },
  { value: 'full', label: 'Full', height: 800 },
];

const BusinessEmbedWidget = () => {
  const { businessId } = useAccountType();
  const [config, setConfig] = useState({
    showServices: true,
    showStaff: true,
    primaryColor: '#FF69B4',
    buttonText: 'Book Now',
    widgetSize: 'medium',
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mark checklist item complete when business visits this page
  useEffect(() => {
    if (businessId) {
      supabase.from('businesses').update({ checklist_booking_link_added: true } as any).eq('id', businessId);
    }
  }, [businessId]);

  const embedUrl = `${window.location.origin}/business/${businessId}`;
  const selectedSize = SIZE_OPTIONS.find(s => s.value === config.widgetSize)!;

  const iframeCode = `<iframe src="${embedUrl}?embed=true&color=${encodeURIComponent(config.primaryColor)}&btn=${encodeURIComponent(config.buttonText)}&size=${config.widgetSize}" width="100%" height="${selectedSize.height}" frameborder="0" style="border-radius:12px;border:1px solid #e0e0e0;"></iframe>`;

  const buttonCode = `<a href="${embedUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;background:${config.primaryColor};color:white;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${config.buttonText}</a>`;

  const copyCode = (code: string, field: string) => {
    navigator.clipboard.writeText(code);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 max-w-5xl">
        <FeatureGate feature="embeddable_booking_widget">
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Link2 className="w-6 h-6 text-primary" /> Booking Widget
            </h1>
            <p className="text-muted-foreground">Add a booking button or widget to your website</p>
          </div>

          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            {/* Config Panel */}
            <Card>
              <CardHeader><CardTitle className="text-base">Customize</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label className="mb-2 block">Button Color</Label>
                  <div className="flex gap-2 items-center mb-2">
                    <input type="color" value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={config.primaryColor} onChange={e => setConfig(c => ({ ...c, primaryColor: e.target.value }))} className="flex-1 font-mono text-sm" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PRESETS.map(color => (
                      <button key={color} onClick={() => setConfig(c => ({ ...c, primaryColor: color }))} className={cn("w-7 h-7 rounded-full border-2 transition-transform", config.primaryColor === color ? "border-foreground scale-110" : "border-transparent")} style={{ background: color }} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Button Text</Label>
                  <Input value={config.buttonText} onChange={e => setConfig(c => ({ ...c, buttonText: e.target.value }))} maxLength={30} />
                </div>

                <div>
                  <Label className="mb-2 block">Widget Size</Label>
                  <div className="flex gap-2">
                    {SIZE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setConfig(c => ({ ...c, widgetSize: opt.value }))} className={cn("flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm font-semibold", config.widgetSize === opt.value ? "border-primary bg-primary/5 text-primary" : "border-border bg-card")}>
                        {opt.label}
                        <span className="text-[10px] font-normal text-muted-foreground">{opt.height}px</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Show Services</p></div>
                  <Switch checked={config.showServices} onCheckedChange={v => setConfig(c => ({ ...c, showServices: v }))} />
                </div>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Show Staff</p></div>
                  <Switch checked={config.showStaff} onCheckedChange={v => setConfig(c => ({ ...c, showStaff: v }))} />
                </div>
              </CardContent>
            </Card>

            {/* Code Output */}
            <div className="space-y-5">
              <Card>
                <CardHeader><CardTitle className="text-base">Embed Widget (iframe)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Paste into your website's HTML for the full booking experience.</p>
                  <div className="relative">
                    <pre className="bg-zinc-900 text-zinc-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">{iframeCode}</pre>
                    <Button size="sm" className="absolute top-2 right-2 bg-primary text-primary-foreground" onClick={() => copyCode(iframeCode, 'iframe')}>
                      {copiedField === 'iframe' ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Booking Button</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">A simple button that opens your booking page — works anywhere.</p>
                  <div className="relative">
                    <pre className="bg-zinc-900 text-zinc-300 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">{buttonCode}</pre>
                    <Button size="sm" className="absolute top-2 right-2 bg-primary text-primary-foreground" onClick={() => copyCode(buttonCode, 'button')}>
                      {copiedField === 'button' ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <a href={embedUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '14px 28px', background: config.primaryColor, color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 700, fontSize: '16px' }}>
                      {config.buttonText}
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Direct Booking Link</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Perfect for Instagram bio, email signature, or social media.</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-3">
                    <span className="text-sm truncate flex-1">{embedUrl}</span>
                    <Button size="sm" variant="outline" onClick={() => copyCode(embedUrl, 'link')}>
                      {copiedField === 'link' ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </FeatureGate>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default BusinessEmbedWidget;
