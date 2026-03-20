import { useState } from 'react';
import { Calendar, Loader2, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { BookingCard } from '@/components/booking/BookingCard';
import { MyWaitlist } from '@/components/waitlist/MyWaitlist';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const BookingsPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { bookings, isLoading, cancelBooking, getUpcomingBookings, getPastBookings } = useBookings();

  const upcomingBookings = getUpcomingBookings();
  const pastBookings = getPastBookings();

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Sign in to view bookings</h3>
              <p className="text-muted-foreground mb-6">
                Create an account or sign in to manage your appointments
              </p>
              <Button 
                className="bg-gradient-primary"
                onClick={() => navigate('/auth')}
              >
                Sign In
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your upcoming and past appointments
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="upcoming">
                  Upcoming
                  {upcomingBookings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary">
                      {upcomingBookings.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
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
                    <h3 className="font-display text-xl font-semibold mb-2">No upcoming bookings</h3>
                    <p className="text-muted-foreground mb-6">Time to treat yourself!</p>
                    <Button 
                      className="bg-gradient-primary"
                      onClick={() => navigate('/search')}
                    >
                      Find Services
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
                    <h3 className="font-display text-xl font-semibold mb-2">No past bookings</h3>
                    <p className="text-muted-foreground">Your booking history will appear here</p>
                  </div>
                )}
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
