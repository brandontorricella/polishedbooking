import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, StickyNote, ChevronRight, Users, Upload, Link2, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClientList, type ClientSummary } from '@/hooks/useClientNotes';
import { cn } from '@/lib/utils';

function ClientsEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <span className="text-6xl block mb-4">👥</span>
      <h2 className="text-2xl font-bold mb-2">No clients yet</h2>
      <p className="text-muted-foreground text-[15px] mb-7">
        Your client list will grow automatically as people book with you.
      </p>

      <div className="bg-card border-2 border-primary/30 rounded-2xl p-6 mb-6 text-left">
        <div className="flex gap-4 items-start mb-4">
          <span className="text-4xl shrink-0">📥</span>
          <div>
            <h3 className="text-[17px] font-bold mb-1">Already have clients elsewhere?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Import your existing client list from Vagaro, Booksy, StyleSeat, or any platform in under 2 minutes.
            </p>
          </div>
        </div>
        <div className="mb-4">
          <Button onClick={() => navigate('/business/migration')} className="text-[15px] h-11 px-6">
            <Upload className="w-4 h-4 mr-2" /> Import Client List →
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          <span>Works with:</span>
          {['Vagaro', 'Booksy', 'StyleSeat', 'Square Appointments', 'Any CSV file'].map(p => (
            <span key={p} className="px-2.5 py-0.5 bg-muted border border-border rounded-full font-medium">{p}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-3">Or grow your client base organically:</p>
        <div className="flex gap-2.5 justify-center flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/business/embed-widget')}>
            <Link2 className="w-3.5 h-3.5 mr-1.5" /> Get Your Booking Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/business/templates')}>
            <Mail className="w-3.5 h-3.5 mr-1.5" /> Message Templates
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ClientListProps {
  businessId: string;
  onSelectClient: (clientId: string) => void;
}

export const ClientList = ({ businessId, onSelectClient }: ClientListProps) => {
  const { clients, loading, fetchClients } = useClientList(businessId);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchClients(search);
  }, [fetchClients, search]);

  const getInitials = (name: string | null, email: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return email[0].toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl"
        />
      </div>

      {/* Client Cards */}
      {clients.length === 0 ? (
        search ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No clients match your search</p>
          </div>
        ) : (
          <ClientsEmptyState />
        )
      ) : (
        <div className="space-y-2">
          {clients.map((client, idx) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => onSelectClient(client.id)}
              className="flex items-center gap-3 p-3 sm:p-4 bg-card border border-border rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Avatar className="w-10 h-10 sm:w-11 sm:h-11 shrink-0">
                <AvatarImage src={client.profile_photo_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(client.display_name, client.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{client.display_name || client.email}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {client.total_bookings} visit{client.total_bookings !== 1 ? 's' : ''}
                  {client.last_booking_date && (
                    <> · Last: {new Date(client.last_booking_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</>
                  )}
                </p>
              </div>

              {client.note_count > 0 && (
                <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                  <StickyNote className="w-3 h-3" />
                  {client.note_count}
                </Badge>
              )}

              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
