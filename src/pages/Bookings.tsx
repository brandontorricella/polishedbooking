import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockBusinesses } from '@/data/mockData';
import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils';

interface MockBooking {
  id: string;
  business: typeof mockBusinesses[0];
  serviceName: string;
  date: Date;
  time: string;
  status: BookingStatus;
  price: number;
}

const mockBookings: MockBooking[] = [
  {
    id: 'b1',
    business: mockBusinesses[0],
    serviceName: 'Haircut & Style',
    date: new Date('2024-01-25'),
    time: '2:00 PM',
    status: 'confirmed',
    price: 75,
  },
  {
    id: 'b2',
    business: mockBusinesses[1],
    serviceName: 'Gel Extensions',
    date: new Date('2024-01-28'),
    time: '11:00 AM',
    status: 'pending',
    price: 85,
  },
  {
    id: 'b3',
    business: mockBusinesses[2],
    serviceName: 'Classic Lash Set',
    date: new Date('2024-01-10'),
    time: '3:00 PM',
    status: 'completed',
    price: 120,
  },
  {
    id: 'b4',
    business: mockBusinesses[3],
    serviceName: 'Swedish Massage',
    date: new Date('2024-01-05'),
    time: '10:00 AM',
    status: 'canceled',
    price: 95,
  },
];

const statusConfig = {
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle, 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  pending: { 
    label: 'Pending', 
    icon: AlertCircle, 
    className: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle, 
    className: 'bg-muted text-muted-foreground' 
  },
  canceled: { 
    label: 'Canceled', 
    icon: XCircle, 
    className: 'bg-destructive/10 text-destructive' 
  },
};

const BookingCard = ({ booking }: { booking: MockBooking }) => {
  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const isPast = booking.status === 'completed' || booking.status === 'canceled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("group", isPast && "opacity-75")}
    >
      <Card className="border-border hover:shadow-soft transition-all">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img 
              src={booking.business.profilePhotoUrl} 
              alt={booking.business.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{booking.serviceName}</h3>
                  <p className="text-sm text-muted-foreground">{booking.business.name}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Message Business</DropdownMenuItem>
                    {!isPast && <DropdownMenuItem>Reschedule</DropdownMenuItem>}
                    {!isPast && <DropdownMenuItem className="text-destructive">Cancel</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{booking.date.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{booking.time}</span>
                </div>
                <Badge className={status.className}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <span className="font-semibold">${booking.price}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  {!isPast && (
                    <Button size="sm" className="bg-gradient-primary">
                      Manage
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                  {booking.status === 'completed' && (
                    <Button size="sm" variant="outline">
                      Book Again
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const BookingsPage = () => {
  const upcomingBookings = mockBookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const pastBookings = mockBookings.filter(b => b.status === 'completed' || b.status === 'canceled');

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
                  <BookingCard key={booking.id} booking={booking} />
                ))
              ) : (
                <div className="text-center py-16">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-display text-xl font-semibold mb-2">No upcoming bookings</h3>
                  <p className="text-muted-foreground mb-6">Time to treat yourself!</p>
                  <Button className="bg-gradient-primary">Find Services</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastBookings.length > 0 ? (
                pastBookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
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
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default BookingsPage;
