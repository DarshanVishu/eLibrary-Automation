'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { NotificationRow, NotificationType } from '@/lib/actions/notifications';
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
} from '@/lib/actions/notifications';
import { useRealtimeNotifications } from '@/lib/hooks/useRealtimeNotifications';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationCenterProps {
  userId?: string;
  /** Path to the "view all" notifications page for this role */
  allNotificationsPath?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

const TYPE_ICON: Record<NotificationType, string> = {
  new_upload: 'upload',
  approved: 'check_circle',
  rejected: 'cancel',
  new_material: 'books',
  general: 'notifications',
};

const TYPE_COLOR: Record<NotificationType, string> = {
  new_upload: 'text-blue-500',
  approved: 'text-green-500',
  rejected: 'text-red-500',
  new_material: 'text-primary',
  general: 'text-muted-foreground',
};

export function NotificationCenter({
  userId,
  allNotificationsPath,
  side,
  align = 'end',
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const pathname = usePathname();

  // Initial load
  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        // Fetch notifications using the server action (more reliable)
        const result = await getNotifications();

        if (!cancelled) {
          if (result.data) {
            setNotifications(result.data as NotificationRow[]);
          } else if (result.error) {
            setError('Failed to load notifications: ' + result.error);
            setNotifications([]);
            // Show user-friendly error toast
            toast.error('Failed to load notifications', {
              description: 'Please refresh the page to try again',
            });
          }
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setError('Failed to load notifications');
          setNotifications([]);
          setLoading(false);
          // Only show error on strict hard reloads or first loads to avoid spam
        }
      }
    };

    fetchNotifications();

    // Hybrid resilience: Re-fetch silently when window regains focus
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, pathname]); // Re-run when user navigates around the SPA

  // Realtime: prepend new notifications
  const handleNewNotification = useCallback((notification: NotificationRow) => {
    setNotifications((prev) => {
      // Deduplicate by id
      if (prev.some((n) => n.id === notification.id)) return prev;
      return [notification, ...prev];
    });
  }, []);

  useRealtimeNotifications(userId, handleNewNotification);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      toast.error('Failed to mark as read', {
        description: 'Please try again',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read', {
        description: 'Please try again',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Icon name="bell" size="md" />
          </Button>
          {unreadCount > 0 && (
            <span className="bg-primary border-background absolute -top-1 -right-1 flex aspect-square h-6 min-w-[16px] items-center justify-center rounded-full border-2 p-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align={align} side={side} forceMount>
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-bold">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-primary h-auto p-0 text-xs font-semibold hover:bg-transparent dark:hover:bg-transparent"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex h-20 items-center justify-center">
              <Icon name="sync" size="sm" className="text-muted-foreground animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Icon name="notifications_off" size="lg" className="mb-2 opacity-20" />
              <p className="text-muted-foreground text-xs font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  asChild
                  className={`hover:bg-muted/40 focus:bg-muted/40 flex cursor-pointer flex-col items-start gap-1 rounded-none border-b border-none px-4 py-3 ring-0! transition-colors ${
                    !n.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <Link href={n.link || '#'} onClick={() => handleMarkAsRead(n.id)}>
                    <div className="flex w-full items-start gap-2.5">
                      {/* Type icon */}
                      <Icon
                        name={TYPE_ICON[n.type as NotificationType] as any}
                        size="sm"
                        className={`mt-0.5 shrink-0 ${TYPE_COLOR[n.type as NotificationType]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex w-full items-start justify-between gap-2">
                          <p
                            className={`text-xs leading-none font-bold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {n.title}
                          </p>
                          <span className="text-muted-foreground shrink-0 text-[10px]">
                            {formatRelativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-1 text-[11px] leading-snug">
                          {n.message}
                        </p>
                        <div className="text-primary mt-1 flex items-center text-[10px] font-bold">
                          View Details
                          <Icon name="chevron_right" size="xs" />
                        </div>
                      </div>
                      {!n.is_read && (
                        <div
                          className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full"
                          title="Unread"
                        />
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>

        {allNotificationsPath && (
          <div className="border-t">
            <DropdownMenuItem asChild className="cursor-pointer p-0">
              <Link
                href={allNotificationsPath}
                className="text-muted-foreground hover:text-primary flex h-10 w-full items-center justify-center text-xs font-bold transition-colors"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
