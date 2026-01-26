import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Grid, List, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockBusinesses } from '@/data/mockData';

const FavoritesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Mock saved businesses
  const [savedBusinesses] = useState(mockBusinesses.slice(0, 3));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">Favorites</h1>
              <p className="text-muted-foreground mt-2">
                {savedBusinesses.length} saved businesses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results */}
          {savedBusinesses.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedBusinesses.map((business, index) => (
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
            ) : (
              <div className="space-y-4">
                {savedBusinesses.map((business, index) => (
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
            )
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">Save businesses you love to easily find them later</p>
              <Button className="bg-gradient-primary">Browse Services</Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default FavoritesPage;
