import { useState } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const NotificationItem = ({ 
  notification, 
  onMarkAsRead 
}: { 
  notification: Notification; 
  onMarkAsRead: (id: string) => void;
}) => {
  const typeIcons: Record<string, string> = {
    booking_confirmation: '✅',
    booking_reminder: '⏰',
    booking_canceled: '❌',
    new_message: '💬',
    promotion: '🎉',
  };

  return (
    <div 
      className={cn(
        "p-3 border-b border-border last:border-0 transition-colors cursor-pointer hover:bg-accent/50",
        !notification.is_read && "bg-primary/5"
      )}
      onClick={() => !notification.is_read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{typeIcons[notification.type] || '📢'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={cn(
              "text-sm truncate",
              !notification.is_read && "font-semibold"
            )}>
              {notification.title}
            </h4>
            {!notification.is_read && (
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <span className="text-xs text-muted-foreground mt-1 block">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    requestNotificationPermission,
  } = useNotifications();

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Request browser notification permission when user opens notifications
      await requestNotificationPermission();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
