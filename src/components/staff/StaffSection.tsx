import { useStaffList, type StaffWithDetails } from '@/hooks/useStaff';
import { StaffCard } from './StaffCard';
import { Skeleton } from '@/components/ui/skeleton';

interface StaffSectionProps {
  businessId: string;
  onBookWithStaff?: (staffId: string) => void;
  onSelectStaff?: (staff: StaffWithDetails) => void;
}

export const StaffSection = ({ businessId, onBookWithStaff, onSelectStaff }: StaffSectionProps) => {
  const { staff, isLoading } = useStaffList(businessId);

  const activeStaff = staff.filter(s => s.is_active);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeStaff.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold">Our Team</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {activeStaff.map(member => (
          <StaffCard
            key={member.id}
            staff={member}
            onBook={onBookWithStaff}
            onSelect={onSelectStaff}
          />
        ))}
      </div>
    </div>
  );
};
