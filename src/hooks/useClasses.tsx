import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAccountType } from './useAccountType';

export interface ClassSchedule {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  instructor_id: string | null;
  duration_minutes: number;
  capacity: number;
  price: number;
  is_free: boolean;
  category: string | null;
  virtual_link: string | null;
  is_virtual: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  instructor?: { id: string; name: string } | null;
}

export interface ClassSession {
  id: string;
  schedule_id: string;
  business_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  is_canceled: boolean;
  cancel_reason: string | null;
  created_at: string;
  schedule?: ClassSchedule;
}

export interface ClassEnrollment {
  id: string;
  session_id: string;
  user_id: string;
  business_id: string;
  status: string;
  payment_intent_id: string | null;
  amount_paid: number;
  enrolled_at: string;
  canceled_at: string | null;
  user?: { display_name: string | null; email: string };
}

export const useClasses = () => {
  const { businessId } = useAccountType();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!businessId) return;
    const { data, error } = await supabase
      .from('class_schedules')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching schedules:', error);
      return;
    }

    // Fetch instructor names
    const instructorIds = (data || []).filter(s => s.instructor_id).map(s => s.instructor_id!);
    let instructorMap: Record<string, { id: string; name: string }> = {};
    if (instructorIds.length > 0) {
      const { data: staffData } = await supabase
        .from('staff_members')
        .select('id, name')
        .in('id', instructorIds);
      if (staffData) {
        staffData.forEach(s => { instructorMap[s.id] = s; });
      }
    }

    setSchedules((data || []).map(s => ({
      ...s,
      is_free: s.is_free ?? false,
      is_virtual: s.is_virtual ?? false,
      is_active: s.is_active ?? true,
      instructor: s.instructor_id ? instructorMap[s.instructor_id] || null : null,
    })));
  }, [businessId]);

  const fetchSessions = useCallback(async (date?: string) => {
    if (!businessId) return;
    let query = supabase
      .from('class_sessions')
      .select('*')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true });

    if (date) {
      query = query.eq('session_date', date);
    } else {
      query = query.gte('session_date', new Date().toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    // Fetch schedule info for each session
    const scheduleIds = [...new Set((data || []).map(s => s.schedule_id))];
    let scheduleMap: Record<string, any> = {};
    if (scheduleIds.length > 0) {
      const { data: scheduleData } = await supabase
        .from('class_schedules')
        .select('*')
        .in('id', scheduleIds);
      if (scheduleData) {
        scheduleData.forEach(s => { scheduleMap[s.id] = s; });
      }
    }

    setSessions((data || []).map(s => ({
      ...s,
      is_canceled: s.is_canceled ?? false,
      enrolled_count: s.enrolled_count ?? 0,
      schedule: scheduleMap[s.schedule_id] || null,
    })));
  }, [businessId]);

  const fetchEnrollments = useCallback(async (sessionId: string): Promise<ClassEnrollment[]> => {
    const { data: enrollments, error } = await supabase
      .from('class_enrollments')
      .select('*')
      .eq('session_id', sessionId)
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Error fetching enrollments:', error);
      return [];
    }

    // Fetch user profiles
    const userIds = (enrollments || []).map(e => e.user_id);
    let userMap: Record<string, { display_name: string | null; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', userIds);
      if (profiles) {
        profiles.forEach(p => { userMap[p.user_id] = p; });
      }
    }

    return (enrollments || []).map(e => ({
      ...e,
      amount_paid: e.amount_paid ?? 0,
      user: userMap[e.user_id] || null,
    }));
  }, []);

  useEffect(() => {
    if (businessId) {
      setLoading(true);
      Promise.all([fetchSchedules(), fetchSessions()]).finally(() => setLoading(false));
    }
  }, [businessId, fetchSchedules, fetchSessions]);

  const createSchedule = async (data: Partial<ClassSchedule>) => {
    if (!businessId) return;
    const { error } = await supabase.from('class_schedules').insert({
      business_id: businessId,
      name: data.name!,
      description: data.description || null,
      instructor_id: data.instructor_id || null,
      duration_minutes: data.duration_minutes || 60,
      capacity: data.capacity || 10,
      price: data.price || 0,
      is_free: data.is_free || false,
      category: data.category || null,
      virtual_link: data.virtual_link || null,
      is_virtual: data.is_virtual || false,
      image_url: data.image_url || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Class created' });
    await fetchSchedules();
    return true;
  };

  const updateSchedule = async (id: string, data: Partial<ClassSchedule>) => {
    const { error } = await supabase.from('class_schedules').update({
      name: data.name,
      description: data.description,
      instructor_id: data.instructor_id || null,
      duration_minutes: data.duration_minutes,
      capacity: data.capacity,
      price: data.price,
      is_free: data.is_free,
      category: data.category,
      virtual_link: data.virtual_link,
      is_virtual: data.is_virtual,
      image_url: data.image_url,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Class updated' });
    await fetchSchedules();
    return true;
  };

  const toggleScheduleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from('class_schedules').update({ is_active: !isActive }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Class ${isActive ? 'deactivated' : 'activated'}` });
    await fetchSchedules();
  };

  const createSession = async (scheduleId: string, sessionDate: string, startTime: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || !businessId) return false;

    const [hours, mins] = startTime.split(':').map(Number);
    const endMins = hours * 60 + mins + schedule.duration_minutes;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    const { error } = await supabase.from('class_sessions').insert({
      schedule_id: scheduleId,
      business_id: businessId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      capacity: schedule.capacity,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Session scheduled' });
    await fetchSessions();
    return true;
  };

  const createBulkSessions = async (scheduleId: string, mode: string, startDate: string, startTime: string, daysOfWeek: number[], weeksCount: number) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule || !businessId) return 0;

    const [hours, mins] = startTime.split(':').map(Number);
    const endMins = hours * 60 + mins + schedule.duration_minutes;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    if (mode === 'single') {
      const success = await createSession(scheduleId, startDate, startTime);
      return success ? 1 : 0;
    }

    // Recurring: generate dates
    const sessionsToCreate: any[] = [];
    const start = new Date(startDate + 'T00:00:00');
    const totalDays = weeksCount * 7;

    for (let d = 0; d < totalDays; d++) {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      if (daysOfWeek.includes(date.getDay())) {
        sessionsToCreate.push({
          schedule_id: scheduleId,
          business_id: businessId,
          session_date: date.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          capacity: schedule.capacity,
        });
      }
    }

    if (sessionsToCreate.length === 0) return 0;

    const { error } = await supabase.from('class_sessions').insert(sessionsToCreate);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return 0;
    }
    toast({ title: `${sessionsToCreate.length} sessions scheduled` });
    await fetchSessions();
    return sessionsToCreate.length;
  };

  const cancelSession = async (sessionId: string, reason?: string) => {
    const { error } = await supabase.from('class_sessions').update({
      is_canceled: true,
      cancel_reason: reason || null,
    }).eq('id', sessionId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Session canceled' });
    await fetchSessions();
  };

  const markAttended = async (enrollmentId: string) => {
    const { error } = await supabase.from('class_enrollments')
      .update({ status: 'attended' })
      .eq('id', enrollmentId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Marked as attended' });
  };

  return {
    schedules,
    sessions,
    loading,
    fetchSchedules,
    fetchSessions,
    fetchEnrollments,
    createSchedule,
    updateSchedule,
    toggleScheduleActive,
    createSession,
    createBulkSessions,
    cancelSession,
    markAttended,
  };
};
