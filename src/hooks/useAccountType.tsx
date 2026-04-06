import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export type AccountType = 'guest' | 'customer' | 'business';

export function useAccountType(): {
  accountType: AccountType;
  loading: boolean;
  businessId: string | null;
} {
  const { user, profile, loading } = useAuth();

  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === 'business' && user) {
      supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          setBusinessId(data?.id ?? null);
        });
    } else {
      setBusinessId(null);
    }
  }, [user, profile?.role]);

  if (loading) return { accountType: 'guest', loading: true, businessId: null };
  if (!user) return { accountType: 'guest', loading: false, businessId: null };
  if (profile?.role === 'business') return { accountType: 'business', loading: false, businessId };
  return { accountType: 'customer', loading: false, businessId: null };
}
