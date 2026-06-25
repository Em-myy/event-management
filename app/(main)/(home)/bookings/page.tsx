// File: src/app/(app)/bookings/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { buildMyBookingsQuery } from "@/utils/queries";
import MyBookingsRealtimeList from "@/components/MyBookingsRealtimeList";

export const metadata = { title: "My Bookings — ESRMS" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: bookings } = await buildMyBookingsQuery(supabase, user.id);

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">Track and manage all your booking requests</p>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
          style={{ background: "#0D1A38" }}
        >
          <CalendarPlus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      <MyBookingsRealtimeList userId={user.id} initialBookings={bookings ?? []} />
    </div>
  );
}