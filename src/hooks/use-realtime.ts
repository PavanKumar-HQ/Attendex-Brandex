"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export type ConnectionStatus = "LIVE" | "CONNECTING" | "OFFLINE";

interface UseRealtimeSubscriptionOptions {
  channelName: string;
  table: string;
  filter?: string; // e.g. "student_id=eq.cc000000-0000-0000-0000-000000000001"
  queryKeysToInvalidate?: (string | undefined)[][];
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

/**
 * Universal Hook for Scoped Supabase Realtime Subscriptions.
 * Automatically manages subscription lifecycles, memory cleanup, connection status,
 * and TanStack Query cache invalidations without full-page reloads.
 */
export function useRealtimeSubscription({
  channelName,
  table,
  filter,
  queryKeysToInvalidate = [],
  onInsert,
  onUpdate,
  onDelete
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");

  useEffect(() => {
    if (!supabase) {
      setStatus("OFFLINE");
      return;
    }

    const channel = supabase.channel(channelName);

    const subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: filter || undefined
      },
      (payload) => {
        // Trigger TanStack Cache Invalidation
        if (queryKeysToInvalidate.length > 0) {
          queryKeysToInvalidate.forEach(key => {
            if (key) queryClient.invalidateQueries({ queryKey: key });
          });
        }

        // Trigger custom handlers if provided
        if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new);
        if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new);
        if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old);
      }
    );

    channel.subscribe((state) => {
      if (state === 'SUBSCRIBED') {
        setStatus("LIVE");
      } else if (state === 'TIMED_OUT' || state === 'CLOSED') {
        setStatus("OFFLINE");
      } else {
        setStatus("CONNECTING");
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, queryClient]);

  return { status };
}
