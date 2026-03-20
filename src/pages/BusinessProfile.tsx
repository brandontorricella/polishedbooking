import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  MessageCircle,
  Heart,
  Share2,
  ChevronRight,
  Check,
  Sparkles,
  Calendar,
  Package,
  Hourglass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { mockBusinesses, mockReviews } from '@/data/mockData';
import type { Business, Service } from '@/types';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useServiceBundles, type ServiceBundle } from '@/hooks/useServiceBundles';
import { BundleCard } from '@/components/bundles/BundleCard';
import { BundleBookingFlow } from '@/components/bundles/BundleBookingFlow';
import { LoyaltyPointsCard } from '@/components/loyalty/LoyaltyPointsCard';
import { JoinWaitlistModal } from '@/components/waitlist/JoinWaitlistModal';

const BusinessProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [business, setBusiness] = useState<Business | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<ServiceBundle | null>(null);
  const { bundles } = useServiceBundles(id);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  useEffect(() => {
    // For now, use mock data. In production, fetch from Supabase
    const found = mockBusinesses.find(b => b.id === id);
    setBusiness(found || mockBusinesses[0]);
  }, [id]);

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Sparkles className="w-8 h-8 animate-pulse text-primary" />
      </div>
    );
  }

  const reviews = mockReviews.filter(r => r.businessId === business.id);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Cover Image */}
      <div className="relative h-64 md:h-80">
        <img
          src={business.coverPhotoUrl || business.profilePhotoUrl}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Actions */}
        <div className="absolute top-20 right-4 flex gap-2">
          <Button 
            size="icon" 
            variant="secondary" 
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={async () => {
              if (!user) { navigate('/auth'); return; }
              await toggleFavorite(business.id);
            }}
          >
            <Heart className={cn("w-5 h-5 transition-all", business && isFavorite(business.id) && "fill-primary text-primary")} />
          </Button>
          <Button size="icon" variant="secondary" className="rounded-full bg-background/80 backdrop-blur-sm">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="container mx-auto px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-6">
          <img
            src={business.profilePhotoUrl}
            alt={business.name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-background object-cover shadow-lg"
          />
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl md:text-3xl font-bold">{business.name}</h1>
              {business.isVerified && (
                <Badge className="bg-primary/10 text-primary border-0">
                  <Check className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {business.isBlackOwned && (
                <Badge className="bg-midnight text-cream border-0">
                  ✊🏿 Black-Owned
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="font-medium text-foreground">{business.rating}</span>
                <span>({business.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {business.location.city}, {business.location.state}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Button 
            className="flex-1 h-12 bg-gradient-primary hover:opacity-90 rounded-xl"
            onClick={() => setShowBookingFlow(true)}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Now
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <MessageCircle className="w-5 h-5" />
          </Button>
          <Button variant="outline" className="h-12 rounded-xl">
            <Phone className="w-5 h-5" />
          </Button>
        </div>

        {/* Loyalty Points */}
        {id && <LoyaltyPointsCard businessId={id} businessName={business.name} />}

        {/* Tabs */}
        <Tabs defaultValue="services" className="space-y-6 mt-6">
          <TabsList className="w-full justify-start bg-muted/50">
            <TabsTrigger value="services">Services</TabsTrigger>
            {bundles.length > 0 && (
              <TabsTrigger value="bundles">
                <Package className="w-4 h-4 mr-1" /> Bundles
              </TabsTrigger>
            )}
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            {business.services.map((service) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer",
                  selectedService?.id === service.id 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedService(service)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.duration} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${service.price}</p>
                    <Button 
                      size="sm" 
                      className="mt-2 bg-gradient-primary hover:opacity-90"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(service);
                        setShowBookingFlow(true);
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Bundles Tab */}
          {bundles.length > 0 && (
            <TabsContent value="bundles" className="space-y-4">
              <p className="text-sm text-muted-foreground">Save when you book multiple services together</p>
              {bundles.map(bundle => (
                <BundleCard key={bundle.id} bundle={bundle} onBook={setSelectedBundle} />
              ))}
            </TabsContent>
          )}

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {business.portfolioImages.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img 
                    src={image} 
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            {reviews.length > 0 ? reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-border"
              >
                <div className="flex items-start gap-3">
                  {review.clientPhotoUrl ? (
                    <img 
                      src={review.clientPhotoUrl} 
                      alt={review.clientName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-medium">{review.clientName?.charAt(0) || 'A'}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{review.clientName || 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1">{review.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No reviews yet</p>
              </div>
            )}
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{business.description}</p>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Location</h3>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 mt-0.5" />
                <div>
                  <p>{business.location.address}</p>
                  <p>{business.location.city}, {business.location.state} {business.location.zip}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold mb-2">Hours</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(business.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}</span>
                    <span className="text-muted-foreground">
                      {hours ? `${hours.open} - ${hours.close}` : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {business.website && (
              <div>
                <h3 className="font-display text-lg font-semibold mb-2">Website</h3>
                <a 
                  href={business.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="w-4 h-4" />
                  {business.website}
                </a>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Book Button (Mobile) */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border md:hidden safe-bottom">
        <Button 
          className="w-full h-14 bg-gradient-primary hover:opacity-90 rounded-xl text-lg"
          onClick={() => setShowBookingFlow(true)}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Book Appointment
        </Button>
      </div>

      <BottomNav />

      {/* Booking Flow Modal */}
      {business && (
        <BookingFlow 
          business={business}
          isOpen={showBookingFlow}
          onClose={() => {
            setShowBookingFlow(false);
            setSelectedService(null);
          }}
          initialService={selectedService || undefined}
        />
      )}

      {/* Bundle Booking Flow Modal */}
      {business && selectedBundle && (
        <BundleBookingFlow
          bundle={selectedBundle}
          business={business}
          isOpen={!!selectedBundle}
          onClose={() => setSelectedBundle(null)}
        />
      )}
    </div>
  );
};

export default BusinessProfile;
