import { useState } from 'react';
import { Plus, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useStaffList, useStaffManagement, type StaffWithDetails } from '@/hooks/useStaff';
import { AddStaffModal } from './AddStaffModal';
import { StaffDetailModal } from './StaffDetailModal';

interface StaffManagerProps {
  businessId: string;
  services: { id: string; name: string; price: number; duration: number }[];
}

export const StaffManager = ({ businessId, services }: StaffManagerProps) => {
  const { staff, isLoading, refetch } = useStaffList(businessId);
  const { updateStaff, deleteStaff } = useStaffManagement(businessId);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithDetails | null>(null);

  const handleToggleActive = async (member: StaffWithDetails) => {
    await updateStaff(member.id, { is_active: !member.is_active } as any);
    refetch();
  };

  const handleToggleBookings = async (member: StaffWithDetails) => {
    await updateStaff(member.id, { is_accepting_bookings: !member.is_accepting_bookings } as any);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Staff Members</h2>
          <p className="text-sm text-muted-foreground">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-gradient-primary">
          <Plus className="w-4 h-4 mr-1" /> Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border">
          <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold mb-1">No staff members yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Add your team so clients can book with specific people</p>
          <Button onClick={() => setShowAddModal(true)} className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-1" /> Add First Staff Member
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {staff.map(member => (
            <div
              key={member.id}
              className={`flex items-center gap-4 p-4 rounded-xl border border-border bg-card transition-opacity ${!member.is_active ? 'opacity-50' : ''}`}
            >
              <Avatar className="w-12 h-12 cursor-pointer" onClick={() => setSelectedStaff(member)}>
                <AvatarImage src={member.profile_photo_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedStaff(member)}>
                <h3 className="font-medium truncate">{member.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{member.title || 'Staff'}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <Switch
                    checked={member.is_accepting_bookings}
                    onCheckedChange={() => handleToggleBookings(member)}
                  />
                  <span className="text-xs text-muted-foreground">Bookings</span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Switch
                    checked={member.is_active}
                    onCheckedChange={() => handleToggleActive(member)}
                  />
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedStaff(member)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddStaffModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        businessId={businessId}
        services={services}
        onSuccess={() => { setShowAddModal(false); refetch(); }}
      />

      {selectedStaff && (
        <StaffDetailModal
          open={!!selectedStaff}
          onOpenChange={(open) => { if (!open) setSelectedStaff(null); }}
          staff={selectedStaff}
          businessId={businessId}
          services={services}
          onSuccess={() => { setSelectedStaff(null); refetch(); }}
        />
      )}
    </div>
  );
};
