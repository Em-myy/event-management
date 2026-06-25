// File: src/utils/queries.ts
import { createClient } from "@/utils/supabase/server";
import type { QueryData } from "@supabase/supabase-js";

/* ── Approvals Queries ────────────────────────────────────── */
export function buildPendingQuery(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase
    .from("events")
    .select(
      `
      id, title, description, status, start_time, end_time, created_at,
      profiles!events_user_id_fkey ( username, email ),
      venues ( name, location, capacity ),
      event_resources ( quantity_requested, resources ( name ) )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
}

export type PendingBooking = QueryData<ReturnType<typeof buildPendingQuery>>[number];


/* ── Dashboard Queries ────────────────────────────────────── */
export function buildRecentQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return supabase
    .from("events")
    .select("id, title, status, start_time, end_time, venues ( name )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
}

export type RecentBooking = QueryData<ReturnType<typeof buildRecentQuery>>[number];


/* ── Bookings Queries ─────────────────────────────────────── */
export function buildMyBookingsQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return supabase
    .from("events")
    .select(
      `
      id, title, description, status, start_time, end_time,
      created_at, rejection_reason,
      venues ( name, location ),
      event_resources ( quantity_requested, resources ( name ) )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export type MyBooking = QueryData<ReturnType<typeof buildMyBookingsQuery>>[number];


export function buildAdminQueries(supabase: Awaited<ReturnType<typeof createClient>>,) {
  return {
    venues: supabase.from("venues").select("*").order("name"),

    resources: supabase.from("resources").select("*").order("name"),

    users: supabase
      .from("profiles")
      .select("*, roles ( name, label )")
      .order("username"),

    invites: supabase
      .from("invites")
      .select(
        `
        id, email, role_id, department, status, created_at, accepted_at,
        profiles!invites_invited_by_fkey ( username )
      `
      )
      .order("created_at", { ascending: false }),

    bookings: supabase
      .from("events")
      .select(
        `
        id, title, description, status, start_time, end_time, created_at,
        rejection_reason,
        profiles!events_user_id_fkey ( username, email, department ),
        venues ( name, location ),
        event_resources ( quantity_requested, resources ( name ) )
      `
      )
      .order("created_at", { ascending: false }),
  };
}

// Export the inferred types for your client components to use
type AdminQueries = ReturnType<typeof buildAdminQueries>;
export type AdminVenue    = QueryData<AdminQueries["venues"]>[number];
export type AdminResource = QueryData<AdminQueries["resources"]>[number];
export type AdminUser     = QueryData<AdminQueries["users"]>[number];
export type AdminInvite   = QueryData<AdminQueries["invites"]>[number];
export type AdminBooking  = QueryData<AdminQueries["bookings"]>[number];

export function buildProfileQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return supabase
    .from("profiles")
    .select("*, roles ( name, label )")
    .eq("id", userId)
    .single();
}

export function buildStatsQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  return supabase
    .from("events")
    .select("status")
    .eq("user_id", userId);
}

export type ProfileData = QueryData<ReturnType<typeof buildProfileQuery>>;