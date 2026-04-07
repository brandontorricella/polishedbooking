import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Business } from '@/types';
import { mockBusinesses } from '@/data/mockData';

interface LocationBasedBusinessesResult {
  topRated: Business[];
  blackOwned: Business[];
  loading: boolean;
  locationDenied: boolean;
  location: { lat: number; lng: number } | null;
  cityName: string | null;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.county || null;
  } catch {
    return null;
  }
}

export function useLocationBasedBusinesses(): LocationBasedBusinessesResult {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [topRated, setTopRated] = useState<Business[]>([]);
  const [blackOwned, setBlackOwned] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getLocationAndFetch() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(loc);
            
            // Reverse geocode to get city name
            const city = await reverseGeocode(loc.lat, loc.lng);
            setCityName(city);
            
            fetchBusinessesForLocation(loc);
          },
          (error) => {
            console.log('Location denied or unavailable:', error.message);
            setLocationDenied(true);
            fetchRandomBusinesses();
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      } else {
        setLocationDenied(true);
        fetchRandomBusinesses();
      }
    }

    async function fetchBusinessesForLocation(loc: { lat: number; lng: number }) {
      try {
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('is_published', true)
          .eq('is_publicly_visible', true)
          .in('subscription_status', ['active', 'trialing'])
          .limit(20);

        if (error || !businesses || businesses.length === 0) {
          const businessesWithDistance = mockBusinesses.map(b => ({
            ...b,
            distance: calculateDistance(loc.lat, loc.lng, b.location.lat, b.location.lng)
          }));

          const sorted = [...businessesWithDistance].sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return (a.distance || 0) - (b.distance || 0);
          });

          setTopRated(sorted.filter(b => b.rating >= 4.5).slice(0, 6));
          setBlackOwned(
            sorted
              .filter(b => b.isBlackOwned)
              .sort((a, b) => (a.distance || 0) - (b.distance || 0))
              .slice(0, 6)
          );
        } else {
          const businessesWithDistance = businesses.map(b => ({
            ...mapDbBusinessToType(b),
            distance: b.location_lat && b.location_lng 
              ? calculateDistance(loc.lat, loc.lng, b.location_lat, b.location_lng)
              : undefined
          }));

          const tierOrder = (t: string | null) => t === 'elite' ? 0 : t === 'pro' ? 1 : 2;
          const sorted = [...businessesWithDistance].sort((a, b) => {
            const tierDiff = tierOrder((a as any).subscriptionTier) - tierOrder((b as any).subscriptionTier);
            if (tierDiff !== 0) return tierDiff;
            if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
            return (a.distance || 0) - (b.distance || 0);
          });

          setTopRated(sorted.filter(b => (b.rating || 0) >= 4.0).slice(0, 6));
          setBlackOwned(
            sorted
              .filter(b => b.isBlackOwned)
              .sort((a, b) => (a.distance || 0) - (b.distance || 0))
              .slice(0, 6)
          );
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        fetchRandomBusinesses();
      } finally {
        setLoading(false);
      }
    }

    async function fetchRandomBusinesses() {
      try {
        const { data: businesses, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('is_published', true)
          .eq('is_publicly_visible', true)
          .in('subscription_status', ['active', 'trialing'])
          .limit(20);

        if (error || !businesses || businesses.length === 0) {
          const shuffled = shuffleArray(mockBusinesses);
          setTopRated(shuffled.filter(b => b.rating >= 4.5).slice(0, 6));
          setBlackOwned(shuffled.filter(b => b.isBlackOwned).slice(0, 6));
        } else {
          const mapped = businesses.map(mapDbBusinessToType);
          const shuffled = shuffleArray(mapped);
          setTopRated(shuffled.filter(b => (b.rating || 0) >= 4.0).slice(0, 6));
          setBlackOwned(shuffled.filter(b => b.isBlackOwned).slice(0, 6));
        }
      } catch (error) {
        console.error('Error fetching random businesses:', error);
        const shuffled = shuffleArray(mockBusinesses);
        setTopRated(shuffled.filter(b => b.rating >= 4.5).slice(0, 6));
        setBlackOwned(shuffled.filter(b => b.isBlackOwned).slice(0, 6));
      } finally {
        setLoading(false);
      }
    }

    getLocationAndFetch();
  }, []);

  return { topRated, blackOwned, loading, locationDenied, location, cityName };
}

function mapDbBusinessToType(db: any): Business {
  return {
    id: db.id,
    ownerId: db.owner_id,
    name: db.name,
    description: db.description || '',
    profilePhotoUrl: db.profile_photo_url,
    coverPhotoUrl: db.cover_photo_url,
    categories: db.categories || [],
    services: [],
    location: {
      address: db.address || '',
      city: db.city || '',
      state: db.state || '',
      zip: db.zip || '',
      lat: db.location_lat || 0,
      lng: db.location_lng || 0,
    },
    phone: db.phone,
    email: db.email,
    website: db.website,
    hours: db.hours || {},
    serviceSetting: db.service_setting || 'in_studio',
    priceRange: db.price_range || 2,
    isBlackOwned: db.is_black_owned || false,
    isVerified: db.is_verified || false,
    isFeatured: db.is_featured || false,
    subscriptionTier: db.subscription_tier || 'basic',
    subscriptionStatus: db.subscription_status || 'active',
    rating: db.rating || 0,
    reviewCount: db.review_count || 0,
    portfolioImages: [],
    createdAt: new Date(db.created_at),
    distance: db.distance,
  };
}
