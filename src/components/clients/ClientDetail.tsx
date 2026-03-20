import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Pin, PinOff, Trash2, Plus, Edit2, Save, X,
  AlertTriangle, Heart, Coffee, Sparkles, Calendar, DollarSign, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useClientDetail, type ClientNote } from '@/hooks/useClientNotes';
import { cn } from '@/lib/utils';

interface ClientDetailProps {
  businessId: string;
  clientId: string;
  onBack: () => void;
}

const NOTE_TYPES = [
  { value: 'general', label: 'General', color: 'bg-muted-foreground', icon: Sparkles },
  { value: 'preference', label: 'Preference', color: 'bg-green-500', icon: Heart },
  { value: 'allergy', label: 'Allergy', color: 'bg-destructive', icon: AlertTriangle },
  { value: 'warning', label: 'Warning', color: 'bg-amber-500', icon: AlertTriangle },
];

const noteTypeConfig = (type: string) => NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];

export const ClientDetail = ({ businessId, clientId, onBack }: ClientDetailProps) => {
  const { detail, loading, fetchDetail, addNote, updateNote, deleteNote, savePreferences } = useClientDetail(businessId);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('general');
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDetail(clientId);
  }, [clientId, fetchDetail]);

  useEffect(() => {
    if (detail?.preferences) {
      setPrefs({ ...detail.preferences });
    }
  }, [detail?.preferences]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote(clientId, newNote, newNoteType);
    setNewNote('');
  };

  const handleTogglePin = async (note: ClientNote) => {
    await updateNote(clientId, note.id, { is_pinned: !note.is_pinned });
  };

  const handleDeleteNote = async (noteId: string) => {
    await deleteNote(clientId, noteId);
  };

  const handleSavePrefs = async () => {
    await savePreferences(clientId, prefs);
    setEditingPrefs(false);
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  if (loading || !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const { client, notes, preferences, bookingHistory, stats } = detail;
  const allergyPrefs = preferences.allergies;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back to Clients
      </Button>

      {/* Client Header */}
      <Card className="border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
              <AvatarImage src={client.profile_photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(client.display_name, client.email)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-bold truncate">{client.display_name || 'Client'}</h2>
              <p className="text-sm text-muted-foreground truncate">{client.email}</p>
              {allergyPrefs && (
                <Badge variant="destructive" className="mt-1.5 gap-1 text-xs">
                  <AlertTriangle className="w-3 h-3" /> Allergy: {allergyPrefs}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Calendar, label: 'Visits', value: stats.total_bookings },
          { icon: DollarSign, label: 'Spent', value: `$${stats.total_spent.toFixed(0)}` },
          { icon: Clock, label: 'Since', value: stats.client_since ? new Date(stats.client_since).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'N/A' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-3 sm:p-4 bg-card border border-border rounded-xl"
          >
            <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
            <span className="block text-lg sm:text-xl font-bold">{stat.value}</span>
            <span className="text-[11px] text-muted-foreground">{stat.label}</span>
          </motion.div>
        ))}
      </div>

      {/* Quick Preferences */}
      <Card className="border-border">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base">Quick Preferences</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { editingPrefs ? setEditingPrefs(false) : setEditingPrefs(true); }}
            className="h-7 text-xs gap-1"
          >
            {editingPrefs ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit2 className="w-3.5 h-3.5" /> Edit</>}
          </Button>
        </CardHeader>
        <CardContent>
          {editingPrefs ? (
            <div className="space-y-3">
              {[
                { key: 'allergies', label: 'Allergies', placeholder: 'Latex, specific products...' },
                { key: 'favorite_products', label: 'Favorite Products', placeholder: 'Products they love...' },
                { key: 'pressure', label: 'Pressure Preference', placeholder: '' },
                { key: 'beverage', label: 'Beverage', placeholder: 'Coffee, tea, water...' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  {field.key === 'pressure' ? (
                    <Select value={prefs.pressure || ''} onValueChange={(v) => setPrefs({ ...prefs, pressure: v })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Not specified" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="firm">Firm</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={prefs[field.key] || ''}
                      onChange={(e) => setPrefs({ ...prefs, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="h-9"
                    />
                  )}
                </div>
              ))}
              <Button size="sm" onClick={handleSavePrefs} className="bg-primary text-primary-foreground w-full gap-1">
                <Save className="w-3.5 h-3.5" /> Save Preferences
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {preferences.allergies && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="w-3 h-3" /> {preferences.allergies}
                </Badge>
              )}
              {preferences.favorite_products && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Heart className="w-3 h-3" /> {preferences.favorite_products}
                </Badge>
              )}
              {preferences.pressure && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  💆 {preferences.pressure}
                </Badge>
              )}
              {preferences.beverage && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Coffee className="w-3 h-3" /> {preferences.beverage}
                </Badge>
              )}
              {Object.keys(preferences).length === 0 && (
                <p className="text-sm text-muted-foreground">No preferences set yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add note form */}
          <div className="space-y-3 p-3 bg-muted/30 rounded-xl">
            <div className="flex flex-wrap gap-1.5">
              {NOTE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setNewNoteType(type.value)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-colors",
                    newNoteType === type.value
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  <type.icon className="w-3 h-3" />
                  {type.label}
                </button>
              ))}
            </div>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this client..."
              rows={2}
              className="resize-none text-sm"
              maxLength={1000}
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="bg-primary text-primary-foreground w-full sm:w-auto gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Note
            </Button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
          ) : (
            <div className="space-y-2">
              {notes.map((note, idx) => {
                const config = noteTypeConfig(note.note_type);
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "p-3 border rounded-xl relative",
                      note.is_pinned ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                    )}
                  >
                    <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", config.color)} />
                    <div className="pl-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] h-5 gap-0.5 capitalize">
                            <config.icon className="w-2.5 h-2.5" /> {note.note_type}
                          </Badge>
                          {note.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(note.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(note)}
                          className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {note.is_pinned ? <><PinOff className="w-3 h-3" /> Unpin</> : <><Pin className="w-3 h-3" /> Pin</>}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking History */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-base">Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {bookingHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No booking history</p>
          ) : (
            <div className="divide-y divide-border">
              {bookingHistory.map(b => (
                <div key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(b.booking_date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-medium">${b.total_price.toFixed(0)}</p>
                    <Badge
                      variant={b.status === 'completed' ? 'default' : b.status === 'canceled' ? 'destructive' : 'secondary'}
                      className="text-[10px] h-4"
                    >
                      {b.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
