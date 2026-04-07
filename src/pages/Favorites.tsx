import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Grid, List, Star, MapPin, BadgeCheck, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { useFavoriteBusinesses, type FavoriteBusiness } from '@/hooks/useFavoriteBusinesses';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';

const FavoriteBusinessCard = ({ 
  business, 
  variant = 'grid',
  onRemove 
}: { 
  business: FavoriteBusiness; 
  variant?: 'grid' | 'list';
  onRemove: () => void;
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const priceDisplay = '$'.repeat(business.price_range || 2);

  if (variant === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all cursor-pointer"
        onClick={() => navigate(`/business/${business.id}`)}
      >
        <img 
          src={business.profile_photo_url || '/placeholder.svg'} 
          alt={business.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
            {business.is_verified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span>{business.rating || 0}</span>
            <span>({business.review_count || 0})</span>
            <span className="mx-1">•</span>
            <span>{priceDisplay}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{business.city}, {business.state}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      whileHover={{ y: -4 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-elevated transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/business/${business.id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={business.cover_photo_url || business.profile_photo_url || '/placeholder.svg'} 
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-destructive/20 transition-colors"
        >
          <Heart className="w-5 h-5 fill-primary text-primary" />
        </button>

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {business.is_featured && (
            <Badge className="bg-gradient-gold border-0">{t('sections', 'featured')}</Badge>
          )}
          {business.is_black_owned && (
            <Badge variant="secondary" className="bg-midnight/90 text-cream border-0">{t('badges', 'blackOwned')}</Badge>
          )}
        </div>

        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-xl border-4 border-card overflow-hidden shadow-elevated">
            <img 
              src={business.profile_photo_url || '/placeholder.svg'} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="p-4 pt-10">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-lg font-semibold text-foreground">{business.name}</h3>
          {business.is_verified && <BadgeCheck className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="font-medium text-foreground">{business.rating || 0}</span>
            <span className="text-muted-foreground">({business.review_count || 0})</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{priceDisplay}</span>
        </div>

        {business.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{business.description}</p>
        )}

        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{business.city}, {business.state}</span>
        </div>

        {business.categories && business.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {business.categories.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="secondary" className="text-xs capitalize">
                {cat.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/business/${business.id}`); }}>
            {t('booking', 'viewProfile')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

const FavoritesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { businesses, loading, refetch } = useFavoriteBusinesses();
  const { toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRemove = async (businessId: string) => {
    await toggleFavorite(businessId);
    refetch();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-4 text-center py-16">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-display text-xl font-semibold mb-2">{t('favorites', 'signInToSee')}</h3>
            <p className="text-muted-foreground mb-6">{t('favorites', 'saveBusinesses')}</p>
            <Button className="bg-gradient-primary" onClick={() => navigate('/auth')}>{t('auth', 'signIn')}</Button>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">{t('favorites', 'title')}</h1>
              <p className="text-muted-foreground mt-2">
                {businesses.length} {businesses.length !== 1 ? t('favorites', 'savedCountPlural') : t('favorites', 'savedCount')}
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

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Sparkles className="w-8 h-8 animate-pulse text-primary" />
            </div>
          ) : businesses.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((biz, index) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <FavoriteBusinessCard business={biz} variant="grid" onRemove={() => handleRemove(biz.id)} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((biz, index) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <FavoriteBusinessCard business={biz} variant="list" onRemove={() => handleRemove(biz.id)} />
                  </motion.div>
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">{t('favorites', 'noFavorites')}</h3>
              <p className="text-muted-foreground mb-6">{t('favorites', 'saveBusinesses')}</p>
              <Button className="bg-gradient-primary" onClick={() => navigate('/search')}>{t('favorites', 'browseServices')}</Button>
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
