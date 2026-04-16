import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns whether the given business collects payments externally
 * (i.e., outside of Polished — at the appointment).
 */
export function useBusinessPaymentMode(businessId: string | undefined | null) {
  const [collectExternally, setCollectExternally] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!businessId) {
      setCollectExternally(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('businesses')
        .select('collect_payments_externally')
        .eq('id', businessId)
        .maybeSingle();
      if (!cancelled) {
        setCollectExternally(!!(data as any)?.collect_payments_externally);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  return { collectExternally, loading };
}
