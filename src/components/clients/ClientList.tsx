import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, StickyNote, ChevronRight, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useClientList, type ClientSummary } from '@/hooks/useClientNotes';
import { cn } from '@/lib/utils';

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
        <div className="text-center py-12">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? 'No clients match your search' : 'No clients yet — they\'ll appear here after their first booking'}
          </p>
        </div>
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
