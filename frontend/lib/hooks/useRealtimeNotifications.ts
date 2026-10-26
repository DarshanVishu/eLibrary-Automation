'use client';

import type { NotificationRow } from '@/lib/actions/notifications';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Subscribes to realtime INSERT events on the notifications table
 * for the currently authenticated user. Calls `onNew` whenever a
 * new notification arrives.
 */
export function useRealtimeNotifications(
  userId: string | undefined,
  onNew: (notification: NotificationRow) => void,
) {
  const onNewRef = useRef(onNew);

  useEffect(() => {
    onNewRef.current = onNew;
  });

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: NotificationRow }) => {
          onNewRef.current(payload.new as NotificationRow);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}
