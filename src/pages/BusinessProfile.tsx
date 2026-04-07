import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star, MapPin, Clock, Phone, Globe, MessageCircle,
  Heart, Share2, ChevronRight, Check, Sparkles,
  Calendar, Package, Hourglass, Award, Gem,
  Edit, Settings, Eye, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookingFlow } from '@/components/booking/BookingFlow';
import { AuthPromptModal } from '@/components/auth/AuthPromptModal';
import { BookNowButton } from '@/components/booking/BookNowButton';
import { GuestConversionBanner } from '@/components/auth/GuestConversionBanner';
import { mockBusinesses, mockReviews } from '@/data/mockData';
import { useReviews } from '@/hooks/useReviews';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import type { Business, Service } from '@/types';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { useServiceBundles, type ServiceBundle } from '@/hooks/useServiceBundles';
import { usePackages } from '@/hooks/usePackages';
import { useMemberships } from '@/hooks/useMemberships';
import { useMessages } from '@/hooks/useMessages';
import { BundleCard } from '@/components/bundles/BundleCard';
import { BundleBookingFlow } from '@/components/bundles/BundleBookingFlow';
import { LoyaltyPointsCard } from '@/components/loyalty/LoyaltyPointsCard';
import { JoinWaitlistModal } from '@/components/waitlist/JoinWaitlistModal';
import { StaffSection } from '@/components/staff/StaffSection';
import { GallerySection } from '@/components/gallery/GallerySection';
import { CommunityBadges } from '@/components/CommunityBadges';
import { toast } from 'sonner';

const BusinessProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { accountType, businessId: ownerBusinessId } = useAccountType();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [business, setBusiness] = useState<Business | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<ServiceBundle | null>(null);
  const { bundles } = useServiceBundles(id);
  const { packages: businessPackages } = usePackages(id);
  const { memberships: businessMemberships } = useMemberships(id);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState('');
  const [previewAsCustomer, setPreviewAsCustomer] = useState(false);
  const [showPhoneNumber, setShowPhoneNumber] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const { getOrCreateConversation } = useMessages();

  const isOwner = accountType === 'business' && ownerBusinessId === id && !previewAsCustomer;
  const { reviews: dbReviews, stats: reviewStats, canReview, createReview, replyToReview, deleteReply, flagReview, sort: reviewSort, setSort: setReviewSort, loading: reviewsLoading } = useReviews(id);
  useEffect(() => {
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
  // Use DB reviews on the reviews tab, mock reviews only for legacy display

  const requireAuth = (action: string, redirectTo?: string) => {
    if (accountType === 'guest') {
      setAuthModalMessage(`Sign up to ${action}`);
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const handleBookClick = () => {
    if (requireAuth('book appointments', `/business/${id}`)) {
      setShowBookingFlow(true);
    }
  };

  const handleFavoriteClick = async () => {
    if (!requireAuth('save your favorite businesses')) return;
    await toggleFavorite(business.id);
  };

  const handleWaitlistClick = () => {
    if (requireAuth('join the waitlist')) {
      setShowWaitlistModal(true);
    }
  };

  const handleMessageClick = async () => {
    if (!requireAuth('message this business')) return;
    if (!id) return;
    setIsStartingChat(true);
    try {
      const conversation = await getOrCreateConversation(id);
      if (conversation) {
        navigate(`/messages?conversation=${conversation.id}`);
      }
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setIsStartingChat(false);
    }
  };

  const handlePhoneClick = () => {
    if (!requireAuth('contact this business')) return;
    if (!business?.phone) {
      toast.info('This business has no phone number listed');
      return;
    }
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `tel:${business.phone.replace(/\D/g, '')}`;
    } else {
      setShowPhoneNumber(prev => !prev);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header />

      {/* Owner Mode Banner */}
      {isOwner && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-midnight text-cream py-2 px-4 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            You're viewing your business profile
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-cream hover:bg-cream/10 h-7"
              onClick={() => setPreviewAsCustomer(true)}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              View as Customer
            </Button>
            <Link to="/business/analytics">
              <Button size="sm" variant="ghost" className="text-cream hover:bg-cream/10 h-7">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Preview Mode Banner */}
      {previewAsCustomer && accountType === 'business' && ownerBusinessId === id && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground py-2 px-4 flex items-center justify-between text-sm">
          <span>Previewing as customer</span>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-primary-foreground hover:bg-primary-foreground/10 h-7"
            onClick={() => setPreviewAsCustomer(false)}
          >
            Exit Preview
          </Button>
        </div>
      )}

      {/* Cover Image */}
      <div className={cn("relative h-64 md:h-80", (isOwner || previewAsCustomer) && "mt-10")}>
        <img
          src={business.coverPhotoUrl || business.profilePhotoUrl}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Actions */}
        <div className="absolute top-20 right-4 flex gap-2">
          {isOwner ? (
            <Link to="/business/analytics">
              <Button 
                size="sm" 
                className="rounded-full bg-background/80 backdrop-blur-sm"
              >
                <Edit className="w-4 h-4 mr-1.5" />
                Edit Profile
              </Button>
            </Link>
          ) : (
            <>
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full bg-background/80 backdrop-blur-sm"
                onClick={handleFavoriteClick}
              >
                <Heart className={cn("w-5 h-5 transition-all", business && accountType !== 'guest' && isFavorite(business.id) && "fill-primary text-primary")} />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full bg-background/80 backdrop-blur-sm">
                <Share2 className="w-5 h-5" />
              </Button>
            </>
          )}
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
              {business.subscriptionTier === 'elite' && (
                <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-foreground border-0 shadow-[0_2px_8px_rgba(255,215,0,0.3)]">
                  <Gem className="w-3 h-3 mr-1" />
                  Verified Elite
                </Badge>
              )}
              {business.subscriptionTier === 'pro' && (
                <Badge className="bg-primary text-primary-foreground border-0">
                  <Award className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              )}
              {business.isBlackOwned && (
                <Badge className="bg-midnight text-cream border-0">
                  ✊🏿 Black-Owned
                </Badge>
              )}
              <CommunityBadges business={business} size="normal" />
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

        {/* Owner Quick Stats */}
        {isOwner && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Views this week', value: '124' },
              { label: 'Bookings', value: '18' },
              { label: 'Rating', value: business.rating.toString() },
            ].map(stat => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-3 text-center">
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          {isOwner ? (
            <>
              <Link to="/business/analytics" className="flex-1">
                <Button className="w-full h-12 bg-gradient-primary hover:opacity-90 rounded-xl">
                  <Settings className="w-5 h-5 mr-2" />
                  Manage Business
                </Button>
              </Link>
              <Link to="/business/analytics?tab=staff">
                <Button variant="outline" className="h-12 rounded-xl">
                  Manage Staff
                </Button>
              </Link>
            </>
          ) : (
            <>
              <BookNowButton
                businessId={id!}
                label="Book Now"
                className="flex-1 h-12 rounded-xl"
                onClick={handleBookClick}
              />
              <Button 
                variant="outline" 
                className="h-12 rounded-xl"
                onClick={handleWaitlistClick}
              >
                <Hourglass className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="h-12 rounded-xl"
                onClick={handleMessageClick}
                disabled={isStartingChat}
              >
                {isStartingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />}
              </Button>
              {business.phone ? (
                showPhoneNumber ? (
                  <a href={`tel:${business.phone.replace(/\D/g, '')}`} className="inline-flex">
                    <Button variant="outline" className="h-12 rounded-xl text-sm font-medium gap-1.5">
                      <Phone className="w-4 h-4" />
                      {business.phone}
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" className="h-12 rounded-xl" onClick={handlePhoneClick}>
                    <Phone className="w-5 h-5" />
                  </Button>
                )
              ) : null}
            </>
          )}
        </div>

        {/* Guest Banner */}
        {accountType === 'guest' && (
          <GuestConversionBanner message="Sign up to book appointments, save favorites, and leave reviews" />
        )}

        {/* Loyalty Points */}
        {id && accountType === 'customer' && <LoyaltyPointsCard businessId={id} businessName={business.name} />}

        {/* Staff Section */}
        {id && (
          <div className="mt-6">
            <StaffSection
              businessId={id}
              onBookWithStaff={(staffId) => {
                if (requireAuth('book with this stylist')) {
                  setShowBookingFlow(true);
                }
              }}
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="services" className="space-y-6 mt-6">
          <TabsList className="w-full justify-start bg-muted/50">
            <TabsTrigger value="services">Services</TabsTrigger>
            {bundles.length > 0 && (
              <TabsTrigger value="bundles">
                <Package className="w-4 h-4 mr-1" /> Bundles
              </TabsTrigger>
            )}
            {businessPackages.filter(p => p.is_active).length > 0 && (
              <TabsTrigger value="packages">📦 Packages</TabsTrigger>
            )}
            {businessMemberships.filter(m => m.is_active).length > 0 && (
              <TabsTrigger value="memberships">💎 Memberships</TabsTrigger>
            )}
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            {isOwner && (
              <Link to="/business/analytics?tab=services">
                <Button variant="outline" size="sm" className="mb-2">
                  <Edit className="w-4 h-4 mr-1.5" />
                  Manage Services
                </Button>
              </Link>
            )}
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
                    {!isOwner && (
                      <Button 
                        size="sm" 
                        className="mt-2 bg-gradient-primary hover:opacity-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(service);
                          handleBookClick();
                        }}
                      >
                        Book
                      </Button>
                    )}
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
                <BundleCard key={bundle.id} bundle={bundle} onBook={(b) => {
                  if (requireAuth('book bundles')) setSelectedBundle(b);
                }} />
              ))}
            </TabsContent>
          )}

          {/* Packages Tab */}
          {businessPackages.filter(p => p.is_active).length > 0 && (
            <TabsContent value="packages" className="space-y-4">
              <p className="text-sm text-muted-foreground">Save money by buying sessions in advance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessPackages.filter(p => p.is_active).map(pkg => {
                  const savings = pkg.original_price ? pkg.original_price - pkg.price : 0;
                  const savingsPct = pkg.original_price ? Math.round((savings / pkg.original_price) * 100) : 0;
                  return (
                    <div key={pkg.id} className="relative bg-card border border-border rounded-xl p-5 overflow-hidden">
                      {savingsPct > 0 && (
                        <Badge className="absolute top-3 right-3 bg-green-500/10 text-green-600 border-green-500/20">{savingsPct}% OFF</Badge>
                      )}
                      <h4 className="font-semibold text-base mb-1">{pkg.name}</h4>
                      {pkg.description && <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>}
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span>📅 {pkg.session_count} sessions</span>
                        <span>⏳ Valid {pkg.validity_days} days</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-1">
                        {pkg.original_price && <span className="line-through text-muted-foreground text-sm">${pkg.original_price.toFixed(2)}</span>}
                        <span className="text-2xl font-bold">${pkg.price.toFixed(2)}</span>
                      </div>
                      {savings > 0 && <p className="text-sm text-green-600 font-medium">Save ${savings.toFixed(2)}</p>}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          )}

          {/* Memberships Tab */}
          {businessMemberships.filter(m => m.is_active).length > 0 && (
            <TabsContent value="memberships" className="space-y-4">
              <p className="text-sm text-muted-foreground">Join a membership plan for recurring access</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {businessMemberships.filter(m => m.is_active).map(mem => (
                  <div key={mem.id} className="bg-card border border-border rounded-xl p-5">
                    <h4 className="font-semibold text-base mb-1">{mem.name}</h4>
                    {mem.description && <p className="text-sm text-muted-foreground mb-3">{mem.description}</p>}
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold">${mem.price.toFixed(2)}</span>
                      <span className="text-muted-foreground text-sm">/{mem.billing_interval === 'weekly' ? 'week' : 'month'}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      {mem.sessions_per_period ? `${mem.sessions_per_period} sessions per period` : 'Unlimited sessions'}
                    </div>
                    {mem.perks && mem.perks.length > 0 && (
                      <div className="space-y-1">
                        {mem.perks.map((perk, i) => (
                          <div key={i} className="text-sm flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-primary" /> {perk}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {/* Portfolio / Gallery Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            {id && <GallerySection businessId={id} />}
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
            {accountType === 'guest' && dbReviews.length > 2 && (
              <GuestConversionBanner message="Sign up to leave your own reviews" />
            )}

            {/* Leave a review form for eligible customers */}
            {canReview && !isOwner && (
              <ReviewForm
                onSubmit={async (rating, text) => {
                  const result = await createReview(rating, text || undefined);
                  return { error: result.error };
                }}
              />
            )}

            <ReviewsList
              reviews={dbReviews}
              stats={reviewStats}
              sort={reviewSort}
              onSortChange={setReviewSort}
              isBusinessOwner={isOwner}
              onReply={isOwner ? replyToReview : undefined}
              onDeleteReply={isOwner ? deleteReply : undefined}
              onFlag={!isOwner ? flagReview : undefined}
            />
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{business.description}</p>
            </div>

            {/* Service Type Indicators */}
            {((business as any).offers_appointments || (business as any).offers_classes || (business as any).offers_virtual) && (
              <div className="flex flex-wrap gap-2">
                {(business as any).offers_appointments && (
                  <Badge variant="secondary" className="text-sm">📅 1-on-1 Appointments</Badge>
                )}
                {(business as any).offers_classes && (
                  <Badge variant="secondary" className="text-sm">👥 Group Classes</Badge>
                )}
                {(business as any).offers_virtual && (
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-sm">💻 Virtual Sessions Available</Badge>
                )}
              </div>
            )}

            {/* Credentials */}
            {(business as any).credentials && (business as any).credentials.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">Credentials & Certifications</h3>
                <div className="space-y-2">
                  {(business as any).credentials.map((cred: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="text-lg">🏆</span>
                      <span className="text-sm font-medium">{cred}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            {(business as any).specialties && (business as any).specialties.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-semibold mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {(business as any).specialties.map((spec: string, i: number) => (
                    <Badge key={i} className="bg-primary/10 text-primary border-primary/20 text-sm">⭐ {spec}</Badge>
                  ))}
                </div>
              </div>
            )}

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

      {/* Sticky Book Button (Mobile) - not for owners */}
      {!isOwner && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border md:hidden safe-bottom">
          <Button 
            className="w-full h-14 bg-gradient-primary hover:opacity-90 rounded-xl text-lg"
            onClick={handleBookClick}
          >
            <Calendar className="w-5 h-5 mr-2" />
            Book Appointment
          </Button>
        </div>
      )}

      <BottomNav />

      {/* Auth Prompt Modal for Guests */}
      <AuthPromptModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        message={authModalMessage}
        redirectTo={`/business/${id}`}
      />

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

      {/* Waitlist Modal */}
      {business && id && (
        <JoinWaitlistModal
          open={showWaitlistModal}
          onOpenChange={setShowWaitlistModal}
          businessId={id}
          businessName={business.name}
          services={business.services.map(s => ({ id: s.id, name: s.name }))}
        />
      )}
    </div>
  );
};

export default BusinessProfile;
