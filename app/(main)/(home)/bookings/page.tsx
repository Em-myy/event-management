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
    <div className="animate-fade-in w-full">
      <div className="page-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
        <div className="w-full sm:w-auto wrap-break-word">
          <h1 className="page-title text-2xl sm:text-3xl md:text-4xl">
            My Bookings
          </h1>
          <p className="page-subtitle text-sm sm:text-base">
            Track and manage all your booking requests
          </p>
        </div>
        <Link
          href="/bookings/new"
          className="flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all hover:opacity-90 shadow-sm"
          style={{ background: "#0D1A38" }}
        >
          <CalendarPlus className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      <MyBookingsRealtimeList
        userId={user.id}
        initialBookings={bookings ?? []}
      />
    </div>
  );
}
