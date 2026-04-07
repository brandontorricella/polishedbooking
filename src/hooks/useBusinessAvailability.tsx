import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DayAvailability {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export function useBusinessAvailability(businessId: string | null) {
  const [availability, setAvailability] = useState<Record<number, DayAvailability>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAvailability = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('business_availability')
      .select('*')
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true });

    if (!error && data) {
      const map: Record<number, DayAvailability> = {};
      data.forEach(d => {
        map[d.day_of_week] = {
          day_of_week: d.day_of_week,
          is_open: d.is_open ?? true,
          open_time: d.open_time || '09:00',
          close_time: d.close_time || '18:00',
        };
      });
      // Fill in missing days with defaults
      for (let i = 0; i < 7; i++) {
        if (!map[i]) {
          map[i] = {
            day_of_week: i,
            is_open: i !== 0 && i !== 6, // closed weekends by default
            open_time: '09:00',
            close_time: '18:00',
          };
        }
      }
      setAvailability(map);
    }
    setLoading(false);
  }, [businessId]);

  const saveAvailability = useCallback(async (hours: Record<number, DayAvailability>) => {
    if (!businessId) return false;
    setSaving(true);

    try {
      for (const [dayStr, day] of Object.entries(hours)) {
        const dayOfWeek = parseInt(dayStr);
        const { error } = await supabase
          .from('business_availability')
          .upsert({
            business_id: businessId,
            day_of_week: dayOfWeek,
            is_open: day.is_open,
            open_time: day.open_time,
            close_time: day.close_time,
          }, { onConflict: 'business_id,day_of_week' });

        if (error) throw error;
      }
      setAvailability(hours);
      toast({ title: 'Hours saved', description: 'Business hours updated successfully.' });
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [businessId, toast]);

  return { availability, loading, saving, fetchAvailability, saveAvailability };
}
