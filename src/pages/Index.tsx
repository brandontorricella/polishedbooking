import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Star, Users, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BusinessCard } from '@/components/ui/BusinessCard';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { SearchFilters } from '@/components/ui/SearchFilters';
import { PromotionCard } from '@/components/promotions/PromotionCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { categories, mockBusinesses } from '@/data/mockData';
import heroImage from '@/assets/hero-beauty.jpg';

const Index = () => {
  const featuredBusinesses = mockBusinesses.filter(b => b.isFeatured);
  const blackOwnedBusinesses = mockBusinesses.filter(b => b.isBlackOwned);
  const promotions = mockBusinesses
    .flatMap(b => (b.promotions || []).map(p => ({ ...p, business: b })))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-hero" />
          <img 
            src={heroImage}
            alt="Beauty salon"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-6 bg-blush text-primary border-primary/20 px-4 py-1.5">
                <Sparkles className="w-4 h-4 mr-2" />
                Now in Los Angeles
              </Badge>
              
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
                Discover <span className="text-gradient">Beauty</span> & <span className="text-gradient">Wellness</span> Near You
              </h1>
              
              <p className="mt-6 text-xl text-muted-foreground max-w-xl">
                Book appointments with top-rated beauty professionals. From hair styling to spa treatments, find your perfect match.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/search">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl w-full sm:w-auto">
                    Find Services
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/business">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl w-full sm:w-auto">
                    For Businesses
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                        <img 
                          src={`https://images.unsplash.com/photo-${1494790108377 + i}-be9c29b29330?w=50`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span>500+ Professionals</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-accent text-accent" />
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

      {/* Search Section */}
      <section className="py-12 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <SearchFilters />
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold">Browse Categories</h2>
              <p className="text-muted-foreground mt-2">Find the perfect service for you</p>
            </div>
            <Link to="/search">
              <Button variant="ghost" className="gap-2">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {categories.slice(0, 8).map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <CategoryCard {...cat} variant="compact" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="mb-2 bg-accent text-accent-foreground">Featured</Badge>
              <h2 className="font-display text-3xl font-bold">Top Rated Professionals</h2>
              <p className="text-muted-foreground mt-2">Highly rated and recommended by our community</p>
            </div>
            <Link to="/search?featured=true">
              <Button variant="ghost" className="gap-2">
                See All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <BusinessCard business={business} variant="featured" />
              </motion.div>
            ))}
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
              <h2 className="font-display text-3xl font-bold">Support Black-Owned Businesses</h2>
              <p className="text-cream/70 mt-2">Discover talented professionals in our community</p>
            </div>
            <Link to="/search?blackOwned=true">
              <Button variant="outline" className="gap-2 border-cream/30 text-cream hover:bg-cream/10">
                Explore All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blackOwnedBusinesses.map((business, index) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <BusinessCard business={business} />
              </motion.div>
            ))}
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
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ready to Get <span className="text-gradient">Polished</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of clients who have discovered their perfect beauty professionals through Polished.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 rounded-xl">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/business">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-xl">
                  List Your Business
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Index;
