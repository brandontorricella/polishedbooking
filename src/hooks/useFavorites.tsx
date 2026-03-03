import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('business_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavoriteIds(new Set(data?.map(f => f.business_id) || []));
    } catch {
      console.error('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (businessId: string): Promise<boolean | null> => {
    if (!user) return null; // null = not logged in

    const isFav = favoriteIds.has(businessId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(businessId);
      else next.add(businessId);
      return next;
    });

    try {
      if (isFav) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('business_id', businessId);
        if (error) throw error;
        toast({ title: 'Removed from favorites' });
        return false;
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({ user_id: user.id, business_id: businessId });
        if (error) throw error;
        toast({ title: 'Added to favorites' });
        return true;
      }
    } catch {
      // Revert optimistic update
      setFavoriteIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(businessId);
        else next.delete(businessId);
        return next;
      });
      toast({ title: 'Failed to update favorites', variant: 'destructive' });
      return isFav;
    }
  }, [user, favoriteIds, toast]);

  const isFavorite = useCallback((businessId: string) => favoriteIds.has(businessId), [favoriteIds]);

  return { favoriteIds, loading, toggleFavorite, isFavorite, fetchFavorites };
};
