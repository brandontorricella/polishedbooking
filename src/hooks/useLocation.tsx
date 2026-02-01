import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  zip?: string;
}

interface UseLocationReturn {
  userLocation: UserLocation | null;
  setUserLocation: (location: UserLocation | null) => void;
  locationError: string | null;
  isLoadingLocation: boolean;
  requestLocation: () => Promise<void>;
  calculateDistance: (lat: number, lng: number) => number | null;
  formatDistance: (miles: number | null) => string;
}

export const useLocation = (): UseLocationReturn => {
  const { profile, updateProfile } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Load saved location from profile on mount
  useEffect(() => {
    if (profile?.location_lat && profile?.location_lng) {
      setUserLocation({
        lat: profile.location_lat,
        lng: profile.location_lng,
        city: profile.location_city || undefined,
        state: profile.location_state || undefined,
      });
    }
  }, [profile]);

  const requestLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const newLocation: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setUserLocation(newLocation);

      // Save to profile if user is authenticated
      if (profile) {
        await updateProfile({
          location_lat: newLocation.lat,
          location_lng: newLocation.lng,
        });
      }
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          setLocationError('Location access denied. Please enable location services.');
          break;
        case geoError.POSITION_UNAVAILABLE:
          setLocationError('Location information unavailable.');
          break;
        case geoError.TIMEOUT:
          setLocationError('Location request timed out.');
          break;
        default:
          setLocationError('Unable to get your location.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  }, [profile, updateProfile]);

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback((lat: number, lng: number): number | null => {
    if (!userLocation) return null;

    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat - userLocation.lat);
    const dLon = toRad(lng - userLocation.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLocation.lat)) *
        Math.cos(toRad(lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [userLocation]);

  const formatDistance = useCallback((miles: number | null): string => {
    if (miles === null) return '';
    if (miles < 0.1) return 'Nearby';
    if (miles < 1) return `${Math.round(miles * 5280 / 100) / 10}k ft`;
    return `${miles.toFixed(1)} mi`;
  }, []);

  return {
    userLocation,
    setUserLocation,
    locationError,
    isLoadingLocation,
    requestLocation,
    calculateDistance,
    formatDistance,
  };
};

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
