import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search as SearchIcon, 
  Grid,
  List,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { categories, mockBusinesses } from '@/data/mockData';
import type { Business } from '@/types';
import { cn } from '@/lib/utils';

type ViewMode = 'grid' | 'list' | 'map';

const SearchPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>(mockBusinesses);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleFiltersChange = (filters: any) => {
    let results = [...mockBusinesses];

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(b => 
        b.name.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.categories.some((c: string) => c.includes(query))
      );
    }

    if (filters.isBlackOwned) {
      results = results.filter(b => b.isBlackOwned);
    }

    if (filters.hasPromotions) {
      results = results.filter(b => b.promotions && b.promotions.length > 0);
    }

    if (filters.minRating && filters.minRating > 0) {
      results = results.filter(b => b.rating >= filters.minRating);
    }

    if (selectedCategories.length > 0) {
      results = results.filter(b => 
        b.categories.some(c => selectedCategories.includes(c))
      );
    }

    setFilteredBusinesses(results);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Find Services</h1>
            <p className="text-muted-foreground mt-2">
              {filteredBusinesses.length} businesses near you
            </p>
          </div>

          <div className="mb-8">
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>

          <div className="mb-8">
            <h3 className="font-medium mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategories.includes(cat.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={cn(
                    "rounded-full",
                    selectedCategories.includes(cat.id) && "bg-gradient-primary"
                  )}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <span className="text-sm text-muted-foreground">{filteredBusinesses.length} results</span>
            <div className="flex items-center gap-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('grid')}>
                <Grid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BusinessCard business={business} />
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-4">
              {filteredBusinesses.map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <BusinessCard business={business} variant="compact" />
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="h-[500px] bg-muted rounded-2xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Map className="w-12 h-12 mx-auto mb-4" />
                <p>Map view coming soon</p>
                <p className="text-sm">Enable location services to see businesses near you</p>
              </div>
            </div>
          )}

          {filteredBusinesses.length === 0 && (
            <div className="text-center py-16">
              <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default SearchPage;
