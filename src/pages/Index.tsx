import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Users, Shield, ChevronRight, MapPin, Loader2, Tag } from 'lucide-react';
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
import { usePromotions } from '@/hooks/usePromotions';
import { saveIntendedDestination } from '@/components/auth/AuthGate';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import heroImage from '@/assets/hero-beauty.jpg';

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
  const { topRated, blackOwned, hispanicOwned, lgbtqOwned, loading, locationDenied, location, cityName } = useLocationBasedBusinesses();
  const { promotions, claimedIds, claimPromotion } = usePromotions();
  const { t } = useTranslation();

  // Service category data with icons and colors
  const serviceCategories = [
    { id: 'hair_styling', name: t('categories', 'hair'), icon: '💇‍♀️', color: 'bg-blush' },
    { id: 'nails', name: t('categories', 'nails'), icon: '💅', color: 'bg-lavender' },
    { id: 'makeup', name: t('categories', 'makeup'), icon: '💄', color: 'bg-rose-100' },
    { id: 'lashes', name: t('categories', 'lashes'), icon: '👁️', color: 'bg-violet-100' },
    { id: 'eyebrows', name: t('categories', 'brows'), icon: '✨', color: 'bg-amber-100' },
    { id: 'facials', name: t('categories', 'skincare'), icon: '🧴', color: 'bg-emerald-100' },
    { id: 'waxing', name: t('categories', 'waxing'), icon: '🌸', color: 'bg-pink-100' },
    { id: 'massage', name: t('categories', 'massage'), icon: '💆', color: 'bg-sky-100' },
    { id: 'barbering', name: t('categories', 'barbering'), icon: '✂️', color: 'bg-slate-100' },
    { id: 'spray_tan', name: t('categories', 'body'), icon: '🌟', color: 'bg-orange-100' },
  ];

  // Redirect business users to their dashboard
  if (accountType === 'business') {
    navigate('/business/analytics');
    return null;
  }

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
        <img 
          src={heroImage}
          alt="Beauty salon"
          className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-[hsl(330,85%,60%,0.15)]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl py-16 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {cityName && (
                <Badge className="mb-6 bg-white/10 text-white border-white/20 backdrop-blur-sm px-4 py-1.5">
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('hero', 'nowIn')} {cityName}
                </Badge>
              )}
              
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                {t('hero', 'title')}
              </h1>
              
              <p className="mt-6 text-xl text-white/85 max-w-xl">
                {t('hero', 'subtitle')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                {accountType === 'guest' ? (
                  <>
                    <Link to="/auth?mode=signup">
                      <Button 
                        size="lg" 
                        className="bg-primary hover:bg-primary/90 text-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto shadow-[0_8px_25px_hsl(340,75%,55%,0.3)]"
                      >
                        {t('hero', 'getStarted')}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/search">
                      <Button size="lg" variant="outline" className="text-white border-white/80 hover:bg-white/10 hover:border-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto bg-transparent">
                        {t('hero', 'browseServices')}
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
                      {t('hero', 'browseServices')}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Link to="/bookings">
                      <Button size="lg" variant="outline" className="text-white border-white/80 hover:bg-white/10 hover:border-white text-lg px-8 h-14 rounded-xl w-full sm:w-auto bg-transparent">
                        {t('hero', 'myBookings')}
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
                  <span>{t('hero', 'professionals')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span>{t('hero', 'avgRating')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>{t('hero', 'verified')}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Guest conversion banner */}
      {accountType === 'guest' && (
        <div className="container mx-auto px-4 relative z-10">
          <GuestConversionBanner message={t('guestBanner', 'signUp')} />
        </div>
      )}

      {/* How It Works - Guest Only */}
      {accountType === 'guest' && (
        <section className="py-16 bg-background border-y border-border">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold">{t('sections', 'howItWorks')}</h2>
              <p className="text-muted-foreground mt-2">{t('sections', 'howItWorksDesc')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '1', title: t('sections', 'discover'), description: t('sections', 'discoverDesc'), icon: '🔍' },
                { step: '2', title: t('sections', 'book'), description: t('sections', 'bookDesc'), icon: '📅' },
                { step: '3', title: t('sections', 'enjoy'), description: t('sections', 'enjoyDesc'), icon: '✨' },
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

      {/* Browse by Service */}
      <section className={`py-16 ${accountType === 'guest' ? '' : 'bg-background border-y border-border'}`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold">{t('sections', 'browseByService')}</h2>
            <p className="text-muted-foreground mt-2">{t('sections', 'browseByServiceDesc')}</p>
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

      {/* Top Rated Businesses */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-accent text-accent-foreground">{t('sections', 'featured')}</Badge>
              <h2 className="font-display text-3xl font-bold">
                {!locationDenied && location ? t('sections', 'topRatedNearYou') : t('sections', 'topRatedProfessionals')}
              </h2>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                {!locationDenied && location ? (
                  <>
                    <MapPin className="w-4 h-4" />
                    {t('sections', 'basedOnLocation')}
                  </>
                ) : (
                  t('sections', 'highlyRated')
                )}
              </p>
            </div>
            <Link to="/search?featured=true">
              <Button variant="ghost" className="gap-2">
                {t('sections', 'seeAll')} <ChevronRight className="w-4 h-4" />
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

      {/* Black-Owned Businesses */}
      <section className="py-16 bg-midnight text-cream">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✊🏿</span>
                <Badge className="bg-cream/20 text-cream border-0">{t('sections', 'blackOwned')}</Badge>
              </div>
              <h2 className="font-display text-3xl font-bold text-cream">
                {!locationDenied && location ? t('sections', 'blackOwnedNearYou') : t('sections', 'blackOwnedBusinesses')}
              </h2>
              <p className="text-cream/70 mt-2">{t('sections', 'blackOwnedDesc')}</p>
            </div>
            <Link to="/search?blackOwned=true">
              <Button 
                variant="ghost" 
                className="gap-2 border border-cream/80 bg-transparent text-cream hover:bg-cream hover:text-midnight"
              >
                {t('sections', 'exploreAll')} <ChevronRight className="w-4 h-4" />
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
              [1, 2, 3].map((i) => (
                <BusinessCardSkeleton key={i} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Hispanic & Latino-Owned */}
      <section className="py-16 bg-gradient-to-br from-[hsl(10,30%,8%)] to-[hsl(15,40%,12%)] text-cream">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🤎</span>
                  <Badge className="bg-orange-900/40 text-orange-200 border-0">{t('sections', 'hispanicOwned')}</Badge>
                </div>
                <h2 className="font-display text-3xl font-bold text-cream">
                  {t('sections', 'hispanicOwnedBusinesses')}
                </h2>
                <p className="text-cream/70 mt-2">{t('sections', 'hispanicOwnedDesc')}</p>
              </div>
              <Link to="/search?hispanicOwned=true">
                <Button 
                  variant="ghost" 
                  className="gap-2 border border-cream/80 bg-transparent text-cream hover:bg-cream hover:text-midnight"
                >
                  {t('sections', 'exploreAll')} <ChevronRight className="w-4 h-4" />
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
              ) : hispanicOwned.length > 0 ? (
                hispanicOwned.slice(0, 3).map((business, index) => (
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
                [1, 2, 3].map((i) => (
                  <BusinessCardSkeleton key={i} />
                ))
              )}
            </div>
          </div>
        </section>

      {/* LGBTQ+-Owned */}
      <section className="py-16 bg-gradient-to-br from-[hsl(270,25%,8%)] to-[hsl(280,35%,14%)] text-cream">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏳️‍🌈</span>
                  <Badge className="bg-purple-900/40 text-purple-200 border-0">{t('sections', 'lgbtq')}</Badge>
                </div>
                <h2 className="font-display text-3xl font-bold text-cream">
                  {t('sections', 'lgbtqBusinesses')}
                </h2>
                <p className="text-cream/70 mt-2">{t('sections', 'lgbtqDesc')}</p>
              </div>
              <Link to="/search?lgbtqOwned=true">
                <Button 
                  variant="ghost" 
                  className="gap-2 border border-cream/80 bg-transparent text-cream hover:bg-cream hover:text-midnight"
                >
                  {t('sections', 'exploreAll')} <ChevronRight className="w-4 h-4" />
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
              ) : lgbtqOwned.length > 0 ? (
                lgbtqOwned.slice(0, 3).map((business, index) => (
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
              <Badge className="mb-2 bg-primary text-primary-foreground">{t('sections', 'deals')}</Badge>
              <h2 className="font-display text-3xl font-bold">{t('sections', 'promotions')}</h2>
              <p className="text-muted-foreground mt-2">{t('sections', 'promotionsDesc')}</p>
            </div>
            <Link to="/promotions">
              <Button variant="ghost" className="gap-2">
                {t('sections', 'viewAll')} <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.length > 0 ? (
              promotions.slice(0, 3).map((promo, index) => (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <PromotionCard 
                    promotion={promo}
                    isClaimed={claimedIds.has(promo.id)}
                    onClaim={claimPromotion}
                  />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Tag className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>{t('sections', 'noPromotions')}</p>
              </div>
            )}
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
              {t('cta', 'readyTitle')} <span className="text-primary">{t('cta', 'readyAccent')}</span>?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              {t('cta', 'readyDesc')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {accountType === 'guest' ? (
                <>
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl">
                      {t('cta', 'createFreeAccount')}
                    </Button>
                  </Link>
                  <Link to="/business">
                    <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                      {t('cta', 'listYourBusiness')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/search">
                    <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl">
                      {t('cta', 'findServices')}
                    </Button>
                  </Link>
                  <Link to="/bookings">
                    <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                      {t('cta', 'viewBookings')}
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
