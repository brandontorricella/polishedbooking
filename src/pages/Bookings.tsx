import { useState } from 'react';
import { Calendar, Loader2, Hourglass, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookingCard } from '@/components/booking/BookingCard';
import { BusinessScheduleView } from '@/components/booking/BusinessScheduleView';
import { MyWaitlist } from '@/components/waitlist/MyWaitlist';
import { BusinessWaitlistManager } from '@/components/waitlist/BusinessWaitlistManager';
import { MyClassesTab } from '@/components/classes/MyClassesTab';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { accountType, businessId, loading: accountLoading } = useAccountType();
  const { bookings, isLoading, cancelBooking, getUpcomingBookings, getPastBookings } = useBookings();
  const { t } = useTranslation();

  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();
  const isBusiness = accountType === 'business' && !!businessId;

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">{t('auth', 'signInToView')}</h3>
              <p className="text-muted-foreground mb-6">
                {t('auth', 'createOrSignIn')}
              </p>
              <Button 
                className="bg-gradient-primary"
                onClick={() => navigate('/auth')}
              >
                {t('auth', 'signIn')}
              </Button>
            </div>
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
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">
              {isBusiness ? t('bookings', 'mySchedule') : t('bookings', 'myBookings')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isBusiness
                ? t('bookings', 'viewUpcoming')
                : t('bookings', 'manageAppointments')}
            </p>
          </div>

          {isLoading || accountLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : isBusiness ? (
            <Tabs defaultValue="schedule" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="schedule">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" /> {t('bookings', 'schedule')}
                </TabsTrigger>
                <TabsTrigger value="waitlist">
                  <Hourglass className="w-3.5 h-3.5 mr-1" /> {t('bookings', 'waitlist')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="schedule">
                <BusinessScheduleView businessId={businessId!} />
              </TabsContent>

              <TabsContent value="waitlist">
                <BusinessWaitlistManager businessId={businessId!} />
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="upcoming">
                  {t('bookings', 'upcoming')}
                  {upcomingBookings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      {upcomingBookings.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past">{t('bookings', 'past')}</TabsTrigger>
                <TabsTrigger value="classes">
                  <Users className="w-3.5 h-3.5 mr-1" /> Classes
                </TabsTrigger>
                <TabsTrigger value="waitlist">
                  <Hourglass className="w-3.5 h-3.5 mr-1" /> {t('bookings', 'waitlist')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingBookings.length > 0 ? (
                  upcomingBookings.map(booking => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onCancel={cancelBooking}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">{t('bookings', 'noUpcoming')}</h3>
                    <p className="text-muted-foreground mb-6">{t('bookings', 'treatYourself')}</p>
                    <Button 
                      className="bg-gradient-primary"
                      onClick={() => navigate('/search')}
                    >
                      {t('bookings', 'findServices')}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastBookings.length > 0 ? (
                  pastBookings.map(booking => (
                    <BookingCard 
                      key={booking.id} 
                      booking={booking}
                      onCancel={cancelBooking}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-display text-xl font-semibold mb-2">{t('bookings', 'noPast')}</h3>
                    <p className="text-muted-foreground">{t('bookings', 'historyHere')}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="classes">
                <MyClassesTab />
              </TabsContent>

              <TabsContent value="waitlist">
                <MyWaitlist />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default BookingsPage;
