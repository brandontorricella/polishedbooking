import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  MessageSquare,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { BookingWithDetails } from '@/hooks/useBookings';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: BookingWithDetails;
  onCancel: (bookingId: string) => Promise<boolean>;
}

const statusConfig = {
  confirmed: { 
    label: 'Confirmed', 
    icon: CheckCircle, 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' 
  },
  pending: { 
    label: 'Pending', 
    icon: AlertCircle, 
    className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400' 
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

const formatTime = (time: string): string => {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
};

export const BookingCard = ({ booking, onCancel }: BookingCardProps) => {
  const navigate = useNavigate();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const status = statusConfig[booking.status];
  const StatusIcon = status.icon;
  const isPast = booking.status === 'completed' || booking.status === 'canceled';
  const bookingDate = parseISO(booking.booking_date);

  const handleCancel = async () => {
    setIsCanceling(true);
    const success = await onCancel(booking.id);
    setIsCanceling(false);
    if (success) {
      setShowCancelDialog(false);
    }
  };

  const handleViewBusiness = () => {
    navigate(`/business/${booking.business_id}`);
  };

  const handleMessage = () => {
    navigate(`/messages?business=${booking.business_id}`);
  };

  const handleBookAgain = () => {
    navigate(`/business/${booking.business_id}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("group", isPast && "opacity-75")}
      >
        <Card className="border-border hover:shadow-soft transition-all">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img 
                src={booking.business?.profile_photo_url || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100'} 
                alt={booking.business?.name || 'Business'}
                className="w-20 h-20 rounded-xl object-cover cursor-pointer"
                onClick={handleViewBusiness}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{booking.service?.name || 'Service'}</h3>
                    <p 
                      className="text-sm text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={handleViewBusiness}
                    >
                      {booking.business?.name || 'Business'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleViewBusiness}>
                        View Business
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleMessage}>
                        Message Business
                      </DropdownMenuItem>
                      {!isPast && (
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setShowCancelDialog(true)}
                        >
                          Cancel Appointment
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(bookingDate, 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(booking.booking_time)}</span>
                  </div>
                  <Badge className={status.className}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                {booking.business?.city && (
                  <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{booking.business.city}, {booking.business.state}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="font-semibold">${booking.total_price}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleMessage}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                    {!isPast && (
                      <Button 
                        size="sm" 
                        className="bg-gradient-primary"
                        onClick={handleViewBusiness}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                    {booking.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={handleBookAgain}>
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

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your appointment with {booking.business?.name} on {format(bookingDate, 'MMMM d')} at {formatTime(booking.booking_time)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
