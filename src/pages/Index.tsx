import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Users, Shield, ChevronRight, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { PromotionCard } from '@/components/promotions/PromotionCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { StayUpdatedWidget } from '@/components/subscription/StayUpdatedWidget';
import { GuestConversionBanner } from '@/components/auth/GuestConversionBanner';
import { categories, mockBusinesses } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { useToast } from '@/hooks/use-toast';
import { useLocationBasedBusinesses } from '@/hooks/useLocationBasedBusinesses';
import { saveIntendedDestination } from '@/components/auth/AuthGate';
import { Skeleton } from '@/components/ui/skeleton';
import heroImage from '@/assets/hero-beauty.jpg';

// Service category data with icons and colors
const serviceCategories = [
  { id: 'hair_styling', name: 'Hair', icon: '💇‍♀️', color: 'bg-blush' },
  { id: 'nails', name: 'Nails', icon: '💅', color: 'bg-lavender' },
  { id: 'makeup', name: 'Makeup', icon: '💄', color: 'bg-rose-100' },
  { id: 'lashes', name: 'Lashes', icon: '👁️', color: 'bg-violet-100' },
  { id: 'eyebrows', name: 'Brows', icon: '✨', color: 'bg-amber-100' },
  { id: 'facials', name: 'Skincare', icon: '🧴', color: 'bg-emerald-100' },
  { id: 'waxing', name: 'Waxing', icon: '🌸', color: 'bg-pink-100' },
  { id: 'massage', name: 'Massage', icon: '💆', color: 'bg-sky-100' },
  { id: 'barbering', name: 'Barbering', icon: '✂️', color: 'bg-slate-100' },
  { id: 'spray_tan', name: 'Body', icon: '🌟', color: 'bg-orange-100' },
];

const BusinessCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <Skeleton className="h-40 w-full rounded-xl mb-4" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <Skeleton className="h-4 w-1/4" />
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { accountType } = useAccountType();
  const { toast } = useToast();
  const { topRated, blackOwned, loading, locationDenied, location, cityName } = useLocationBasedBusinesses();
  
  const promotions = mockBusinesses
    .flatMap(b => (b.promotions || []).map(p => ({ ...p, business: b })))
    .slice(0, 3);

  // Redirect business users to their dashboard
  if (accountType === 'business') {
    navigate('/business/analytics');
    return null;
  }

  // Auth gate for Find Services button
  const handleFindServicesClick = () => {
    if (accountType === 'guest') {
      saveIntendedDestination('/search');
      navigate('/auth?mode=signup&role=client');
      return;
    }
    navigate('/search');
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[580px] flex items-center pt-16 overflow-hidden">
        {/* Background image */}
        <img 
          src={heroImage}
          alt="Beauty salon"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.6]"
        />
        {/* Dark overlay with subtle pink tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-[hsl(330,85%,60%,0.15)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Location pill */}
              {cityName && (
                <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5">
                  <MapPin className="w-4 h-4 mr-2" />
                  Now in {cityName}
                </Badge>
              )}
              
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                Find <span className="text-primary">Beauty</span> Services Near You
              </h1>
              
              <p className="mt-6 text-xl text-white/85 max-w-xl">
                Book with top-rated beauty professionals in your area
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {accountType === 'guest' ? (
                  <>
                    <Link to="/auth?mode=signup">
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto shadow-[0_8px_25px_hsl(340,75%,55%,0.3)]"
                      >
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/search">
                      <Button size="lg" variant="outline" className="text-white border-white/80 hover:bg-white/10 hover:border-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto bg-transparent">
                        Browse Services
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto shadow-[0_8px_25px_hsl(340,75%,55%,0.3)]"
                      onClick={handleFindServicesClick}
                    >
                      Browse Services
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Link to="/bookings">
                      <Button size="lg" variant="outline" className="text-white border-white/80 hover:bg-white/10 hover:border-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto bg-transparent">
                        My Bookings
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="mt-10 flex flex-wrap items-center gap-8 text-sm text-white/90">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gradient-to-br from-primary to-primary/60" />
                    ))}
                  </div>
                  <span>500+ Professionals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span>4.9 Average Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Verified Providers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guest conversion banner */}
      {accountType === 'guest' && (
        <div className="container mx-auto px-4 relative z-10">
          <GuestConversionBanner message="Sign up to book appointments, save favorites, and get personalized recommendations" />
        </div>
      )}

      {/* How It Works - Guest Only */}
      {accountType === 'guest' && (
        <section className="py-16 bg-background border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold">How It Works</h2>
              <p className="text-muted-foreground mt-2">Book your next beauty appointment in 3 easy steps</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Discover', description: 'Browse beauty professionals near you by service, location, and rating', icon: '🔍' },
                { step: '2', title: 'Book', description: 'Choose a service, pick your date and time, and confirm your appointment', icon: '📅' },
                { step: '3', title: 'Enjoy', description: 'Show up and enjoy your service. Leave a review to help others!', icon: '✨' },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by Service - Category Cards */}
      <section className={`py-16 ${accountType === 'guest' ? '' : 'bg-background border-y border-border'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold">Browse by Service</h2>
            <p className="text-muted-foreground mt-2">Tap a category to find specialists</p>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-10 gap-3 max-w-4xl mx-auto">
            {serviceCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl ${category.color} hover:scale-105 transition-transform cursor-pointer`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs font-medium text-foreground">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Businesses - Location Aware */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-accent text-accent-foreground">Featured</Badge>
              <h2 className="font-display text-3xl font-bold">
                Top Rated {!locationDenied && location ? 'Near You' : 'Professionals'}
              </h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                {!locationDenied && location ? (
                  <>
                    <MapPin className="w-4 h-4" />
                    Based on your location
                  </>
                ) : (
                  'Highly rated and recommended by our community'
                )}
              </p>
            </div>
            <Link to="/search?featured=true">
              <Button variant="ghost" className="gap-2">
                See All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
              </>
            ) : (
              topRated.slice(0, 3).map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <BusinessCard 
                    business={business} 
                    variant="featured"
                    showDistance={!locationDenied && !!business.distance}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Black-Owned Businesses Spotlight */}
      <section className="py-16 bg-midnight text-cream">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✊🏿</span>
                <Badge className="bg-cream/20 text-cream border-0">Black-Owned</Badge>
              </div>
              <h2 className="font-display text-3xl font-bold text-cream">
                Black-Owned {!locationDenied && location ? 'Near You' : 'Businesses'}
              </h2>
              <p className="text-cream/70 mt-2">Discover talented professionals in our community</p>
            </div>
            <Link to="/search?blackOwned=true">
              <Button 
                variant="ghost" 
                className="gap-2 border border-cream/80 bg-transparent text-cream hover:bg-cream hover:text-midnight"
              >
                Explore All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
                <BusinessCardSkeleton />
              </>
            ) : blackOwned.length > 0 ? (
              blackOwned.slice(0, 3).map((business, index) => (
                <motion.div
                  key={business.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <BusinessCard 
                    business={business}
                    showDistance={!locationDenied && !!business.distance}
                  />
                </motion.div>
              ))
            ) : (
              /* Show placeholder cards when no black-owned businesses found */
              [1, 2, 3].map((i) => (
                <BusinessCardSkeleton key={i} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Promotions Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-primary text-primary-foreground">Deals</Badge>
              <h2 className="font-display text-3xl font-bold">Promotions & Discounts</h2>
              <p className="text-muted-foreground mt-2">Limited time offers from top professionals</p>
            </div>
            <Link to="/promotions">
              <Button variant="ghost" className="gap-2">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo, index) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <PromotionCard 
                  promotion={promo}
                  businessName={promo.business.name}
                  businessPhoto={promo.business.profilePhotoUrl}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[hsl(0,0%,5%)]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Get <span className="text-primary">Polished</span>?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Join thousands of clients who have discovered their perfect beauty professionals through Polished.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {accountType === 'guest' ? (
                <>
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl">
                      Create Free Account
                    </Button>
                  </Link>
                  <Link to="/business">
                    <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                      List Your Business
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/search">
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl">
                      Find Services
                    </Button>
                  </Link>
                  <Link to="/bookings">
                    <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                      View Bookings
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <BottomNav />
      <StayUpdatedWidget />
    </div>
  );
};

export default Index;
