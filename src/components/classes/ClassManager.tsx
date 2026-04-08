import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, ChevronLeft, ChevronRight, CalendarDays, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClasses, ClassSession, ClassEnrollment } from '@/hooks/useClasses';
import { CreateClassModal } from './CreateClassModal';
import { AddSessionsModal } from './AddSessionsModal';
import { cn } from '@/lib/utils';

export const ClassManager = () => {
  const {
    schedules, sessions, loading,
    fetchSessions, fetchEnrollments,
    toggleScheduleActive, cancelSession, markAttended,
  } = useClasses();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [schedulingFor, setSchedulingFor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Record<string, ClassEnrollment[]>>({});

  const dateStr = selectedDate.toISOString().split('T')[0];
  const daySessions = sessions.filter(s => s.session_date === dateStr);

  const handleDateNav = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
    fetchSessions(d.toISOString().split('T')[0]);
  };

  const handleToggleRoster = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
      return;
    }
    const data = await fetchEnrollments(sessionId);
    setEnrollments(prev => ({ ...prev, [sessionId]: data }));
    setExpandedSession(sessionId);
  };

  const handleCancelSession = async (sessionId: string) => {
    const reason = window.prompt('Reason for canceling (optional):');
    if (reason === null) return;
    await cancelSession(sessionId, reason);
    fetchSessions(dateStr);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Classes</h2>
          <p className="text-sm text-muted-foreground">Manage group class schedules and sessions</p>
        </div>
        <Button onClick={() => { setEditingSchedule(null); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create Class
        </Button>
      </div>

      <Tabs defaultValue="schedules">
        <TabsList>
          <TabsTrigger value="schedules">Class Templates</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="space-y-4 mt-4">
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-1">No classes yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create a class template then schedule individual sessions</p>
                <Button onClick={() => setShowCreateModal(true)}>Create Your First Class</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {schedules.map(schedule => (
                <Card key={schedule.id} className={cn(!schedule.is_active && 'opacity-60')}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-base">{schedule.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {schedule.is_virtual && <Badge variant="secondary">💻 Virtual</Badge>}
                          {!schedule.is_active && <Badge variant="destructive">Inactive</Badge>}
                          {schedule.category && <Badge variant="outline">{schedule.category}</Badge>}
                        </div>
                      </div>
                    </div>
                    {schedule.description && <p className="text-sm text-muted-foreground line-clamp-2">{schedule.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>⏱ {schedule.duration_minutes} min</span>
                      <span>👥 Max {schedule.capacity}</span>
                      <span>{schedule.is_free ? '🆓 Free' : `💳 $${Number(schedule.price).toFixed(2)}`}</span>
                      {schedule.instructor && <span>👤 {schedule.instructor.name}</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap pt-1">
                      <Button size="sm" variant="outline" onClick={() => { setEditingSchedule(schedule); setShowCreateModal(true); }}>Edit</Button>
                      <Button size="sm" onClick={() => setSchedulingFor(schedule)}>
                        <CalendarDays className="w-3 h-3 mr-1" /> Schedule
                      </Button>
                      <Button size="sm" variant={schedule.is_active ? 'secondary' : 'default'}
                        onClick={() => toggleScheduleActive(schedule.id, schedule.is_active)}>
                        {schedule.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-4">
          <div className="flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => handleDateNav(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="font-medium text-sm min-w-[200px] text-center">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => handleDateNav(1)}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { setSelectedDate(new Date()); fetchSessions(new Date().toISOString().split('T')[0]); }}>Today</Button>
          </div>

          {daySessions.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No sessions scheduled for this day.</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {daySessions.map(session => {
                const spotsLeft = session.capacity - session.enrolled_count;
                return (
                  <Card key={session.id} className={cn(session.is_canceled && 'opacity-60 border-destructive/30')}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{session.schedule?.name || 'Class'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.start_time.slice(0, 5)} – {session.end_time.slice(0, 5)}
                            {session.schedule?.instructor && ` · ${(session.schedule as any).instructor?.name || ''}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">{session.enrolled_count}/{session.capacity}</span>
                          <p className="text-xs text-muted-foreground">enrolled</p>
                          {spotsLeft <= 3 && spotsLeft > 0 && <Badge variant="secondary" className="text-xs mt-1">⚠️ {spotsLeft} left</Badge>}
                          {spotsLeft === 0 && <Badge variant="destructive" className="text-xs mt-1">FULL</Badge>}
                        </div>
                      </div>

                      {session.is_canceled && (
                        <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-lg">
                          Session canceled{session.cancel_reason ? `: ${session.cancel_reason}` : ''}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleToggleRoster(session.id)}>
                          {expandedSession === session.id ? 'Hide Roster' : 'View Roster'}
                        </Button>
                        {!session.is_canceled && (
                          <Button size="sm" variant="destructive" onClick={() => handleCancelSession(session.id)}>Cancel Session</Button>
                        )}
                      </div>

                      {expandedSession === session.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="border-t pt-3 mt-2">
                          <h5 className="text-sm font-medium mb-2">Enrolled Clients</h5>
                          {(enrollments[session.id] || []).length === 0 ? (
                            <p className="text-sm text-muted-foreground">No enrollments yet</p>
                          ) : (
                            <div className="space-y-2">
                              {(enrollments[session.id] || []).map(e => (
                                <div key={e.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2 text-sm">
                                  <span className="font-medium">{e.user?.display_name || e.user?.email || 'Unknown'}</span>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={e.status === 'attended' ? 'default' : e.status === 'canceled' ? 'destructive' : 'secondary'}>
                                      {e.status}
                                    </Badge>
                                    {e.status === 'enrolled' && (
                                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markAttended(e.id)}>
                                        Mark Attended
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showCreateModal && (
        <CreateClassModal
          schedule={editingSchedule}
          onClose={() => { setShowCreateModal(false); setEditingSchedule(null); }}
        />
      )}

      {schedulingFor && (
        <AddSessionsModal
          schedule={schedulingFor}
          onClose={() => setSchedulingFor(null)}
        />
      )}
    </div>
  );
};
