import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface StaffMember {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  is_accepting_bookings: boolean;
  display_order: number;
  commission_type: string;
  commission_rate: number;
  created_at: string;
}

export interface StaffService {
  id: string;
  staff_id: string;
  service_id: string;
  custom_duration: number | null;
  custom_price: number | null;
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

export interface StaffSchedule {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface StaffWithDetails extends StaffMember {
  staff_services: StaffService[];
  staff_schedules: StaffSchedule[];
}

export const useStaffList = (businessId: string | null) => {
  const [staff, setStaff] = useState<StaffWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStaff = useCallback(async () => {
    if (!businessId) { setStaff([]); setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select(`
          *,
          staff_services(*, service:services(id, name, duration, price)),
          staff_schedules(*)
        `)
        .eq('business_id', businessId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setStaff((data as unknown as StaffWithDetails[]) || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  return { staff, isLoading, refetch: fetchStaff };
};

export const useStaffManagement = (businessId: string) => {
  const { toast } = useToast();

  const addStaff = async (data: {
    name: string;
    title?: string;
    bio?: string;
    email?: string;
    phone?: string;
    commissionType?: string;
    commissionRate?: number;
    serviceIds?: string[];
    schedule?: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[];
  }) => {
    try {
      const { data: staffData, error } = await supabase
        .from('staff_members')
        .insert({
          business_id: businessId,
          name: data.name,
          title: data.title || null,
          bio: data.bio || null,
          email: data.email || null,
          phone: data.phone || null,
          commission_type: data.commissionType || 'none',
          commission_rate: data.commissionRate || 0,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Add services
      if (data.serviceIds && data.serviceIds.length > 0) {
        const { error: svcErr } = await supabase
          .from('staff_services')
          .insert(data.serviceIds.map(sid => ({
            staff_id: staffData.id,
            service_id: sid,
          })));
        if (svcErr) console.error('Error adding staff services:', svcErr);
      }

      // Add schedule
      if (data.schedule && data.schedule.length > 0) {
        const { error: schedErr } = await supabase
          .from('staff_schedules')
          .insert(data.schedule.map(s => ({
            staff_id: staffData.id,
            ...s,
          })));
        if (schedErr) console.error('Error adding staff schedule:', schedErr);
      }

      toast({ title: 'Staff added', description: `${data.name} has been added to your team.` });
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const updateStaff = async (staffId: string, updates: Partial<StaffMember>) => {
    try {
      const { error } = await supabase
        .from('staff_members')
        .update(updates)
        .eq('id', staffId)
        .eq('business_id', businessId);
      if (error) throw error;
      toast({ title: 'Staff updated' });
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const deleteStaff = async (staffId: string) => {
    return updateStaff(staffId, { is_active: false } as any);
  };

  const updateStaffServices = async (staffId: string, serviceIds: string[]) => {
    try {
      // Remove existing
      await supabase.from('staff_services').delete().eq('staff_id', staffId);
      // Insert new
      if (serviceIds.length > 0) {
        const { error } = await supabase
          .from('staff_services')
          .insert(serviceIds.map(sid => ({ staff_id: staffId, service_id: sid })));
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  const updateStaffSchedule = async (staffId: string, schedule: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[]) => {
    try {
      await supabase.from('staff_schedules').delete().eq('staff_id', staffId);
      if (schedule.length > 0) {
        const { error } = await supabase
          .from('staff_schedules')
          .insert(schedule.map(s => ({ staff_id: staffId, ...s })));
        if (error) throw error;
      }
      return true;
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      return false;
    }
  };

  return { addStaff, updateStaff, deleteStaff, updateStaffServices, updateStaffSchedule };
};
