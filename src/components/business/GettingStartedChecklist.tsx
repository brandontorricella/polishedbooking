import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Upload, Camera, Link2, Store, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChecklistState {
  dismissed: boolean;
  profile_complete: boolean;
  services_added: boolean;
  photo_uploaded: boolean;
  clients_imported: boolean;
  booking_link_added: boolean;
}

interface GettingStartedChecklistProps {
  businessId: string;
}

export function GettingStartedChecklist({ businessId }: GettingStartedChecklistProps) {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('description, phone, address, checklist_clients_imported, checklist_booking_link_added, checklist_photo_uploaded, checklist_dismissed, profile_photo_url')
      .eq('id', businessId)
      .maybeSingle();

    if (!biz) { setLoading(false); return; }
    if (biz.checklist_dismissed) { setChecklist({ dismissed: true } as ChecklistState); setLoading(false); return; }

    const { count: serviceCount } = await supabase
      .from('services' as any)
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const { count: importedCount } = await supabase
      .from('imported_clients')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    const { count: galleryCount } = await supabase
      .from('gallery_posts')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId);

    setChecklist({
      dismissed: false,
      profile_complete: !!(biz.description && biz.description.length > 20 && biz.phone && biz.address),
      services_added: (serviceCount || 0) > 0,
      photo_uploaded: !!(biz.checklist_photo_uploaded || (galleryCount || 0) > 0 || biz.profile_photo_url),
      clients_imported: !!(biz.checklist_clients_imported || (importedCount || 0) > 0),
      booking_link_added: !!biz.checklist_booking_link_added,
    });
    setLoading(false);
  }, [businessId]);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  async function handleDismiss() {
    await supabase.from('businesses').update({ checklist_dismissed: true } as any).eq('id', businessId);
    setChecklist(prev => prev ? { ...prev, dismissed: true } : null);
  }

  if (loading || !checklist || checklist.dismissed) return null;

  const items = [
    { id: 'profile', label: 'Complete your business profile', desc: 'Add description, phone, and location', completed: checklist.profile_complete, link: '/business/analytics', icon: Store, btnLabel: 'Set Up →' },
    { id: 'services', label: 'Add your services', desc: 'List what you offer with pricing and duration', completed: checklist.services_added, link: '/business/analytics', icon: Scissors, btnLabel: 'Set Up →' },
    { id: 'photo', label: 'Upload a profile photo', desc: 'Businesses with photos get 3x more bookings', completed: checklist.photo_uploaded, link: '/business/analytics', icon: Camera, btnLabel: 'Upload →' },
    { id: 'clients', label: 'Import your existing clients', desc: 'Bring your client list from Vagaro, Booksy, or any platform', completed: checklist.clients_imported, link: '/business/migration', icon: Upload, highlight: true, btnLabel: 'Import →' },
    { id: 'booking_link', label: 'Share your booking link', desc: 'Add it to your Instagram bio, Google Business, or website', completed: checklist.booking_link_added, link: '/business/embed-widget', icon: Link2, btnLabel: 'Get Link →' },
  ];

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  if (completedCount === totalCount) {
    handleDismiss();
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-7">
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-[17px] font-bold">Getting Started</h3>
          <span className="text-sm text-muted-foreground font-medium">{completedCount} of {totalCount} complete</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-1 mb-4">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex justify-between items-center p-3.5 rounded-xl transition-colors gap-4",
                item.completed && "opacity-60",
                !item.completed && item.highlight && "bg-primary/[0.06] border border-primary/20",
                !item.completed && !item.highlight && "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className={cn(
                  "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-sm",
                  item.completed ? "bg-green-500 border-green-500 text-white" : "border-border"
                )}>
                  {item.completed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold truncate", item.completed && "line-through text-muted-foreground")}>{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">{item.desc}</p>
                </div>
              </div>
              {!item.completed ? (
                <Button size="sm" variant={item.highlight ? "default" : "outline"} onClick={() => navigate(item.link)} className="shrink-0 text-xs h-8">
                  {item.btnLabel}
                </Button>
              ) : (
                <span className="text-xs text-green-500 font-semibold shrink-0">Done ✓</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-3.5 text-right">
        <button onClick={handleDismiss} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Dismiss — I'm all set
        </button>
      </div>
    </div>
  );
}
