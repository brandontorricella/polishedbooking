import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TimeBlock {
  id: string;
  business_id: string;
  staff_id: string | null;
  block_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  is_all_day: boolean;
  created_at: string;
  staff?: { name: string } | null;
}

export function useTimeBlocks(businessId: string | null) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchBlocks = useCallback(async (date?: string, staffId?: string) => {
    if (!businessId) return;
    setLoading(true);

    let query = supabase
      .from('time_blocks')
      .select('*, staff:staff_members(name)')
      .eq('business_id', businessId)
      .order('block_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (date) query = query.eq('block_date', date);
    if (staffId && staffId !== 'all') {
      query = query.or(`staff_id.eq.${staffId},staff_id.is.null`);
    }

    const { data, error } = await query;
    if (!error) {
      const mapped = (data || []).map((b: any) => ({
        ...b,
        staff: Array.isArray(b.staff) ? b.staff[0] || null : b.staff,
      }));
      setBlocks(mapped);
    }
    setLoading(false);
  }, [businessId]);

  const createBlock = useCallback(async (block: {
    staff_id?: string;
    block_date: string;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    reason: string;
    notes: string;
  }) => {
    if (!businessId) return false;

    const { error } = await supabase.from('time_blocks').insert({
      business_id: businessId,
      staff_id: block.staff_id || null,
      block_date: block.block_date,
      start_time: block.is_all_day ? '00:00' : block.start_time,
      end_time: block.is_all_day ? '23:59' : block.end_time,
      is_all_day: block.is_all_day,
      reason: block.reason,
      notes: block.notes || null,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  }, [businessId, toast]);

  const deleteBlock = useCallback(async (blockId: string) => {
    const { error } = await supabase.from('time_blocks').delete().eq('id', blockId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  }, [toast]);

  return { blocks, loading, fetchBlocks, createBlock, deleteBlock };
}
