import { motion } from 'framer-motion';
import { Star, MapPin, Heart, BadgeCheck, Crown, Tag } from 'lucide-react';
import type { Business } from '@/types';
import { Badge } from './badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';

interface BusinessCardProps {
  business: Business;
  onViewProfile?: (id: string) => void;
  onBook?: (id: string) => void;
  variant?: 'default' | 'featured' | 'compact';
  showDistance?: boolean;
}

export const BusinessCard = ({ 
  business, 
  onViewProfile, 
  onBook,
  variant = 'default',
  showDistance = false
}: BusinessCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isSaved = isFavorite(business.id);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate('/auth');
      return;
    }
    await toggleFavorite(business.id);
  };

  const priceDisplay = '$'.repeat(business.priceRange);

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all cursor-pointer"
        onClick={() => onViewProfile?.(business.id)}
      >
        <img 
          src={business.profilePhotoUrl} 
          alt={business.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{business.name}</h3>
            {business.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span>{business.rating}</span>
            <span>({business.reviewCount})</span>
            <span className="mx-1">•</span>
            <span>{priceDisplay}</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{business.location.city}, {business.location.state}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-elevated transition-all duration-300",
        variant === 'featured' && "ring-2 ring-accent shadow-glow"
      )}
    >
      {/* Cover Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={business.coverPhotoUrl || business.profilePhotoUrl} 
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        
        {/* Save Button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors"
        >
          <Heart className={cn("w-5 h-5 transition-all", isSaved ? "fill-primary text-primary scale-110" : "text-foreground")} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {business.isFeatured && (
            <Badge className="bg-gradient-gold border-0">
              <Crown className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {business.isBlackOwned && (
            <Badge variant="secondary" className="bg-midnight/90 text-cream border-0">
              Black-Owned
            </Badge>
          )}
          {business.promotions && business.promotions.length > 0 && (
            <Badge variant="destructive" className="bg-primary border-0">
              <Tag className="w-3 h-3 mr-1" />
              Deal
            </Badge>
          )}
        </div>

        {/* Profile Photo Overlay */}
        <div className="absolute -bottom-8 left-4">
          <div className="w-16 h-16 rounded-xl border-4 border-card overflow-hidden shadow-elevated">
            <img 
              src={business.profilePhotoUrl} 
              alt={business.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-foreground">{business.name}</h3>
              {business.isVerified && <BadgeCheck className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-medium text-foreground">{business.rating}</span>
                <span className="text-muted-foreground">({business.reviewCount})</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{priceDisplay}</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
          {business.description}
        </p>

        <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{business.location.city}, {business.location.state}</span>
          {showDistance && business.distance !== undefined && (
            <span className="ml-1">• {business.distance.toFixed(1)} mi</span>
          )}
          {business.serviceSetting === 'mobile' || business.serviceSetting === 'both' ? (
            <Badge variant="outline" className="ml-2 text-xs">Mobile Available</Badge>
          ) : null}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {business.categories.slice(0, 3).map((cat) => (
            <Badge key={cat} variant="secondary" className="text-xs capitalize">
              {cat.replace('_', ' ')}
            </Badge>
          ))}
        </div>

        {/* Promotion Banner */}
        {business.promotions && business.promotions[0] && (
          <div className="mt-4 p-3 rounded-lg bg-blush border border-primary/20">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{business.promotions[0].title}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{business.promotions[0].description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onViewProfile?.(business.id)}
          >
            View Profile
          </Button>
          <Button 
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => onBook?.(business.id)}
          >
            Book Now
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
