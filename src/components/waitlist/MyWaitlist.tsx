import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hourglass, Calendar, Clock, MapPin, X, Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientWaitlist } from '@/hooks/useWaitlist';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const MyWaitlist = () => {
  const { entries, loading, fetchMyEntries, leaveWaitlist } = useClientWaitlist();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEntries();
  }, [fetchMyEntries]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Hourglass className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-display font-semibold text-lg mb-1">No waitlist entries</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Join a waitlist when your preferred times are fully booked
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, idx) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            "p-4 bg-card border rounded-xl",
            entry.status === 'notified'
              ? "border-primary bg-primary/5"
              : "border-border"
          )}
        >
          {/* Business info */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={entry.business_photo || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {(entry.business_name || 'B')[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{entry.business_name}</p>
              {entry.service_name && (
                <p className="text-xs text-muted-foreground truncate">{entry.service_name}</p>
              )}
            </div>
            <Badge
              variant={entry.status === 'notified' ? 'default' : 'secondary'}
              className={cn(
                "text-xs shrink-0",
                entry.status === 'notified' && "bg-primary text-primary-foreground"
              )}
            >
              {entry.status === 'notified' ? (
                <><Bell className="w-3 h-3 mr-0.5" /> Spot Available!</>
              ) : (
                <><Hourglass className="w-3 h-3 mr-0.5" /> Waiting</>
              )}
            </Badge>
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
            {entry.preferred_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(entry.preferred_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {entry.preferred_time_start && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {entry.preferred_time_start} - {entry.preferred_time_end}
              </span>
            )}
            {entry.flexible_dates && (
              <Badge variant="outline" className="text-[10px] h-5">Flexible</Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {entry.status === 'notified' && (
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground gap-1"
                onClick={() => navigate(`/business/${entry.business_id}`)}
              >
                Book Now <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className={cn(entry.status !== 'notified' && "flex-1")}
              onClick={() => leaveWaitlist(entry.id)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Leave
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
