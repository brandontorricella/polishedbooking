import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Grid,
  List,
  Map as MapIcon,
  X,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { BusinessMap } from '@/components/map/BusinessMap';
import { LocationPermissionModal } from '@/components/location/LocationPermissionModal';
import { categories, mockBusinesses } from '@/data/mockData';
import { useLocation } from '@/hooks/useLocation';
import { supabase } from '@/integrations/supabase/client';
import type { Business } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'map';

interface CurrentFilters {
  query?: string;
  isBlackOwned?: boolean;
  hasPromotions?: boolean;
  minRating?: number;
}

interface BusinessWithDistance extends Business {
  distance: number | null;
}

const SearchPage = () => {
  const navigate = useNavigate();
  const { userLocation, locationError, isLoadingLocation, requestLocation, setUserLocation, calculateDistance, formatDistance } = useLocation();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [currentFilters, setCurrentFilters] = useState<CurrentFilters>({});
  const [maxDistance, setMaxDistance] = useState<number>(9999);
  const [bookingBusiness, setBookingBusiness] = useState<Business | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [dbBusinesses, setDbBusinesses] = useState<Business[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

  // Fetch publicly visible businesses from database
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('is_published', true)
          .eq('is_publicly_visible', true)
          .in('subscription_status', ['active', 'trialing']);

        if (!error && data && data.length > 0) {
          const mapped: Business[] = data.map((b) => ({
            id: b.id,
            ownerId: b.owner_id,
            name: b.name,
            description: b.description || '',
            categories: b.categories || [],
            rating: b.rating || 0,
            reviewCount: b.review_count || 0,
            priceRange: (b.price_range || 2) as 1 | 2 | 3 | 4,
            location: {
              address: b.address || '',
              city: b.city || '',
              state: b.state || '',
              zip: b.zip || '',
              lat: b.location_lat || 0,
              lng: b.location_lng || 0,
            },
            hours: {} as any,
            images: b.cover_photo_url ? [b.cover_photo_url] : [],
            services: [],
            isBlackOwned: b.is_black_owned || false,
            isFeatured: b.is_featured || false,
            isVerified: b.is_verified || false,
            serviceSetting: (b.service_setting || 'in_studio') as any,
            subscriptionTier: (b.subscription_tier || 'basic') as any,
            subscriptionStatus: (b.subscription_status || 'active') as any,
            portfolioImages: [],
            createdAt: new Date(b.created_at),
            promotions: [],
            profilePhotoUrl: b.profile_photo_url || undefined,
            coverPhotoUrl: b.cover_photo_url || undefined,
          }));
          setDbBusinesses(mapped);
        } else {
          setDbBusinesses([]);
        }
      } catch {
        setDbBusinesses([]);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchBusinesses();
  }, []);

  // Use DB businesses if available, otherwise fall back to mock data
  const sourceBusinesses = dbBusinesses.length > 0 ? dbBusinesses : mockBusinesses;

  // Calculate distances and sort businesses
  const businessesWithDistance = useMemo((): BusinessWithDistance[] => {
    return sourceBusinesses.map(business => ({
      ...business,
      distance: calculateDistance(business.location.lat, business.location.lng)
    })).sort((a, b) => {
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      return 0;
    });
  }, [sourceBusinesses, calculateDistance]);

  // Apply all filters
  const filteredBusinesses = useMemo(() => {
    let results = [...businessesWithDistance];

    // Text search
    if (currentFilters.query) {
      const query = currentFilters.query.toLowerCase();
      results = results.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.categories.some((c: string) => c.toLowerCase().includes(query))
      );
    }

    // Black-owned filter
    if (currentFilters.isBlackOwned) {
      results = results.filter(b => b.isBlackOwned);
    }

    // Promotions filter
    if (currentFilters.hasPromotions) {
      results = results.filter(b => b.promotions && b.promotions.length > 0);
    }

    // Rating filter
    if (currentFilters.minRating && currentFilters.minRating > 0) {
      results = results.filter(b => b.rating >= currentFilters.minRating!);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      results = results.filter(b => 
        b.categories.some(c => selectedCategories.includes(c))
      );
    }

    // Distance filter
    if (maxDistance < 9999 && userLocation) {
      results = results.filter(b => b.distance !== null && b.distance <= maxDistance);
    }

    return results;
  }, [businessesWithDistance, currentFilters, selectedCategories, maxDistance, userLocation]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const clearCategories = () => {
    setSelectedCategories([]);
  };

  const handleFiltersChange = (filters: CurrentFilters) => {
    setCurrentFilters(filters);
  };

  const handleViewProfile = (businessId: string) => {
    navigate(`/business/${businessId}`);
  };

  const handleBook = (businessId: string) => {
    const business = mockBusinesses.find(b => b.id === businessId);
    if (business) {
      setBookingBusiness(business);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Find Services</h1>
            <p className="text-muted-foreground mt-2">
              {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} 
              {userLocation ? ' near you' : ' available'}
            </p>
          </div>

          {/* Location Banner */}
          <div className="mb-6">
            {!userLocation && !isLoadingLocation && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Enable location</p>
                    <p className="text-sm text-muted-foreground">
                      See businesses sorted by distance
                    </p>
                  </div>
                </div>
                <Button onClick={requestLocation} size="sm">
                  Enable
                </Button>
              </div>
            )}
            {isLoadingLocation && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Getting your location...</span>
              </div>
            )}
            {locationError && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{locationError}</p>
                <Button variant="outline" size="sm" onClick={requestLocation}>
                  Try Again
                </Button>
              </div>
            )}
          </div>

          <div className="mb-8">
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>

          {/* Distance Filter */}
          {userLocation && (
            <div className="mb-6">
              <label className="text-sm font-medium mr-3">Distance:</label>
              <select 
                value={maxDistance} 
                onChange={e => setMaxDistance(Number(e.target.value))}
                className="p-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value={5}>Within 5 miles</option>
                <option value={10}>Within 10 miles</option>
                <option value={25}>Within 25 miles</option>
                <option value={50}>Within 50 miles</option>
                <option value={9999}>Any distance</option>
              </select>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Categories</h3>
              {selectedCategories.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearCategories}
                  className="text-primary hover:text-primary/80"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear ({selectedCategories.length})
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <Button
                    key={cat.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={cn(
                      "rounded-full transition-all",
                      isSelected && "bg-gradient-primary shadow-pink"
                    )}
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">{filteredBusinesses.length} results</span>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-md">
                <Grid className="w-4 h-4 mr-1" />
                Grid
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-md">
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button 
                variant={viewMode === 'map' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => {
                  if (!userLocation) {
                    setShowLocationModal(true);
                  }
                  setViewMode('map');
                }}
                className="rounded-md"
              >
                <MapIcon className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>

          {/* Results */}
          {viewMode === 'grid' && filteredBusinesses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="relative">
                    <BusinessCard 
                      business={business} 
                      onViewProfile={handleViewProfile}
                      onBook={handleBook}
                    />
                    {business.distance !== null && (
                      <div className="absolute top-3 right-14 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(business.distance)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === 'list' && filteredBusinesses.length > 0 && (
            <div className="space-y-4">
              {filteredBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <div className="relative">
                    <BusinessCard 
                      business={business} 
                      variant="compact" 
                      onViewProfile={handleViewProfile}
                      onBook={handleBook}
                    />
                    {business.distance !== null && (
                      <div className="absolute top-4 right-4 bg-muted px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(business.distance)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="h-[calc(100vh-300px)] min-h-[400px] rounded-2xl overflow-hidden border border-border">
              <BusinessMap
                businesses={filteredBusinesses}
                userLocation={userLocation}
                onBusinessSelect={(business) => navigate(`/business/${business.id}`)}
                className="w-full h-full"
              />
            </div>
          )}

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
              {selectedCategories.length > 0 && (
                <Button variant="outline" onClick={clearCategories}>
                  Clear Category Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />

      {/* Booking Flow Modal */}
      {bookingBusiness && (
        <BookingFlow 
          business={bookingBusiness}
          isOpen={!!bookingBusiness}
          onClose={() => setBookingBusiness(null)}
        />
      )}

      {/* Location Permission Modal */}
      <LocationPermissionModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onLocationGranted={(coords) => {
          setUserLocation(coords);
          setShowLocationModal(false);
        }}
        onManualLocation={(location) => {
          setUserLocation({ lat: location.lat, lng: location.lng });
          setShowLocationModal(false);
        }}
      />
    </div>
  );
};

export default SearchPage;