import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Star, 
  Tag, 
  Calendar,
  Home,
  Truck
} from 'lucide-react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';
import { Switch } from './switch';
import { Slider } from './slider';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  onSearch?: (query: string) => void;
  onFiltersChange?: (filters: FilterState) => void;
}

interface FilterState {
  query: string;
  isBlackOwned: boolean;
  isHispanicOwned: boolean;
  isLgbtqOwned: boolean;
  hasPromotions: boolean;
  minRating: number;
  priceRange: number[];
  serviceSetting: 'all' | 'in_studio' | 'mobile';
  availability: 'all' | 'today' | 'tomorrow' | 'this_week';
}

export const SearchFilters = ({ onSearch, onFiltersChange }: SearchFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    query: '',
    isBlackOwned: false,
    isHispanicOwned: false,
    isLgbtqOwned: false,
    hasPromotions: false,
    minRating: 0,
    priceRange: [1, 4],
    serviceSetting: 'all',
    availability: 'all',
  });

  const handleQueryChange = (value: string) => {
    const newFilters = { ...filters, query: value };
    setFilters(newFilters);
    onSearch?.(value);
    onFiltersChange?.(newFilters);
  };

  const handleFilterChange = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const activeFiltersCount = [
    filters.isBlackOwned,
    filters.isHispanicOwned,
    filters.isLgbtqOwned,
    filters.hasPromotions,
    filters.minRating > 0,
    filters.priceRange[0] > 1 || filters.priceRange[1] < 4,
    filters.serviceSetting !== 'all',
    filters.availability !== 'all',
  ].filter(Boolean).length;

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      query: filters.query,
      isBlackOwned: false,
      isHispanicOwned: false,
      isLgbtqOwned: false,
      hasPromotions: false,
      minRating: 0,
      priceRange: [1, 4],
      serviceSetting: 'all',
      availability: 'all',
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search services, businesses..."
            value={filters.query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card border-border focus:border-primary"
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="lg"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "h-12 px-4 rounded-xl relative",
            showFilters && "bg-gradient-primary"
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Quick Filter Tags */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={filters.isBlackOwned ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all px-4 py-2",
            filters.isBlackOwned && "bg-midnight text-cream border-midnight"
          )}
          onClick={() => handleFilterChange('isBlackOwned', !filters.isBlackOwned)}
        >
          ✊🏿 Black-Owned
        </Badge>
        <Badge 
          variant={filters.isHispanicOwned ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all px-4 py-2",
            filters.isHispanicOwned && "bg-[hsl(15,60%,25%)] text-orange-100 border-[hsl(15,60%,25%)]"
          )}
          onClick={() => handleFilterChange('isHispanicOwned', !filters.isHispanicOwned)}
        >
          🤎 Hispanic-Owned
        </Badge>
        <Badge 
          variant={filters.isLgbtqOwned ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all px-4 py-2",
            filters.isLgbtqOwned && "bg-[hsl(270,50%,30%)] text-purple-100 border-[hsl(270,50%,30%)]"
          )}
          onClick={() => handleFilterChange('isLgbtqOwned', !filters.isLgbtqOwned)}
        >
          🏳️‍🌈 LGBTQ+
        </Badge>
        <Badge 
          variant={filters.hasPromotions ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all px-4 py-2",
            filters.hasPromotions && "bg-primary"
          )}
          onClick={() => handleFilterChange('hasPromotions', !filters.hasPromotions)}
        >
          <Tag className="w-3 h-3 mr-1" />
          Deals & Discounts
        </Badge>
        <Badge 
          variant={filters.minRating >= 4.5 ? "default" : "outline"}
          className={cn(
            "cursor-pointer transition-all px-4 py-2",
            filters.minRating >= 4.5 && "bg-accent text-accent-foreground"
          )}
          onClick={() => handleFilterChange('minRating', filters.minRating >= 4.5 ? 0 : 4.5)}
        >
          <Star className="w-3 h-3 mr-1 fill-current" />
          Top Rated (4.5+)
        </Badge>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-card rounded-2xl border border-border space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Filters</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Service Setting */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Service Location</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all' as const, label: 'All', icon: MapPin },
                    { value: 'in_studio' as const, label: 'In Studio', icon: Home },
                    { value: 'mobile' as const, label: 'Mobile', icon: Truck },
                  ].map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      variant={filters.serviceSetting === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('serviceSetting', value)}
                      className={cn(
                        "flex-1",
                        filters.serviceSetting === value && "bg-gradient-primary"
                      )}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Availability</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all' as const, label: 'Any Time' },
                    { value: 'today' as const, label: 'Today' },
                    { value: 'tomorrow' as const, label: 'Tomorrow' },
                    { value: 'this_week' as const, label: 'This Week' },
                  ].map(({ value, label }) => (
                    <Button
                      key={value}
                      variant={filters.availability === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterChange('availability', value)}
                      className={cn(
                        "flex-1",
                        filters.availability === value && "bg-gradient-primary"
                      )}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Price Range</label>
                  <span className="text-sm text-muted-foreground">
                    {'$'.repeat(filters.priceRange[0])} - {'$'.repeat(filters.priceRange[1])}
                  </span>
                </div>
                <Slider
                  value={filters.priceRange}
                  min={1}
                  max={4}
                  step={1}
                  onValueChange={(value) => handleFilterChange('priceRange', value)}
                  className="py-2"
                />
              </div>

              {/* Toggle Switches */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✊🏿</span>
                    <div>
                      <label className="text-sm font-medium">Black-Owned Businesses</label>
                      <p className="text-xs text-muted-foreground">Support Black entrepreneurs</p>
                    </div>
                  </div>
                  <Switch
                    checked={filters.isBlackOwned}
                    onCheckedChange={(checked) => handleFilterChange('isBlackOwned', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Tag className="w-6 h-6 text-primary" />
                    <div>
                      <label className="text-sm font-medium">Has Promotions</label>
                      <p className="text-xs text-muted-foreground">Businesses with active deals</p>
                    </div>
                  </div>
                  <Switch
                    checked={filters.hasPromotions}
                    onCheckedChange={(checked) => handleFilterChange('hasPromotions', checked)}
                  />
                </div>
              </div>

              <Button className="w-full bg-gradient-primary" size="lg" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
