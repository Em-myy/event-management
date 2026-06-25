"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseTableChangeRefreshOptions {
  /** Postgres table to listen to */
  table: string;
  /** Schema, defaults to "public" */
  schema?: string;
  /** Which event(s) to listen for */
  event?: ChangeEvent;
  /** Optional Postgres Changes filter, e.g. "user_id=eq.abc123" */
  filter?: string;
  /** Unique channel name — must differ per mounted instance */
  channelName: string;
  /** Called whenever a matching change arrives, before refresh */
  onChange?: () => void;
  /** Call router.refresh() automatically on every change. Default true. */
  autoRefresh?: boolean;
  /** How long the "live update" pill stays visible, in ms */
  pingDuration?: number;
}

/**
 * Subscribes to Postgres Changes on a table and (by default) calls
 * router.refresh() whenever a row the current user is allowed to see
 * (per RLS) changes. Returns `pinged`, a short-lived boolean you can
 * use to show a "List updated" indicator.
 */
export function useTableChangeRefresh({
  table,
  schema = "public",
  event = "*",
  filter,
  channelName,
  onChange,
  autoRefresh = true,
  pingDuration = 2500,
}: UseTableChangeRefreshOptions) {
  const router = useRouter();
  const [pinged, setPinged] = useState(false);
  const pingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        // Supabase's overload typing for this call is finicky across
        // versions — the runtime shape below is correct per their docs.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        } as any,
        () => {
          onChange?.();
          if (autoRefresh) router.refresh();

          setPinged(true);
          if (pingTimeout.current) clearTimeout(pingTimeout.current);
          pingTimeout.current = setTimeout(() => setPinged(false), pingDuration);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (pingTimeout.current) clearTimeout(pingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, table, schema, event, filter]);

  return { pinged };
}