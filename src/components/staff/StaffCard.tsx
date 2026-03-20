import { motion } from 'framer-motion';
import { Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { StaffWithDetails } from '@/hooks/useStaff';

interface StaffCardProps {
  staff: StaffWithDetails;
  onBook?: (staffId: string) => void;
  onSelect?: (staff: StaffWithDetails) => void;
}

export const StaffCard = ({ staff, onBook, onSelect }: StaffCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl border border-border bg-card text-center cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onSelect?.(staff)}
    >
      <Avatar className="w-20 h-20 mx-auto mb-3">
        <AvatarImage src={staff.profile_photo_url || ''} alt={staff.name} />
        <AvatarFallback className="text-lg bg-primary/10 text-primary">
          {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <h3 className="font-semibold">{staff.name}</h3>
      {staff.title && (
        <p className="text-sm text-muted-foreground mt-0.5">{staff.title}</p>
      )}
      {staff.staff_services.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {staff.staff_services.length} service{staff.staff_services.length !== 1 ? 's' : ''}
        </p>
      )}
      {staff.is_accepting_bookings && onBook && (
        <Button
          size="sm"
          className="mt-3 bg-gradient-primary hover:opacity-90 rounded-full px-6"
          onClick={(e) => {
            e.stopPropagation();
            onBook(staff.id);
          }}
        >
          <Calendar className="w-3 h-3 mr-1" />
          Book
        </Button>
      )}
    </motion.div>
  );
};
