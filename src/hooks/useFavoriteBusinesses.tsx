import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FavoriteBusiness {
  id: string;
  name: string;
  description: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  review_count: number | null;
  price_range: number | null;
  is_verified: boolean | null;
  is_black_owned: boolean | null;
  is_featured: boolean | null;
  categories: string[] | null;
  service_setting: string | null;
  favorited_at: string;
}

export const useFavoriteBusinesses = () => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<FavoriteBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavoriteBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          created_at,
          businesses (
            id, name, description, profile_photo_url, cover_photo_url,
            city, state, rating, review_count, price_range,
            is_verified, is_black_owned, is_featured, categories,
            service_setting
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: FavoriteBusiness[] = (data || [])
        .filter((f: any) => f.businesses)
        .map((f: any) => ({
          ...f.businesses,
          favorited_at: f.created_at,
        }));

      setBusinesses(mapped);
    } catch (err) {
      console.error('Failed to fetch favorite businesses', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavoriteBusinesses();
  }, [fetchFavoriteBusinesses]);

  return { businesses, loading, refetch: fetchFavoriteBusinesses };
};
