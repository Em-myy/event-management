// File: src/app/(app)/bookings/[id]/edit/page.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BookingWizard from "@/components/BookingWizard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildEditQuery } from "@/utils/queries";

export const metadata = { title: "Edit Booking — ESRMS" };

export default async function EditBookingPage({
  params,
}: {
  // 1. Next.js 15 requires params to be typed as a Promise (or awaited)
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) redirect("/");

  // 2. Await the params before trying to read the ID!
  const resolvedParams = await params;

  // 3. Pass the resolved ID to your query
  const { data: booking, error } = await buildEditQuery(
    supabase,
    resolvedParams.id, 
    user.id
  );

  /* Booking not found, not owned by this user, or already actioned */
  if (error) {
    console.error("SUPABASE ERROR:", error);
    return (
      <div className="p-10 text-red-500">
        <h1 className="text-2xl font-bold">Query Error!</h1>
        <pre className="mt-4 bg-red-50 p-4 rounded-xl text-sm overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  // Also check if booking is null before checking its status!
  if (!booking) {
    redirect("/bookings");
  }

  if (booking.status !== "pending") {
    /* Approved / rejected bookings cannot be edited */
    redirect("/bookings");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3 mb-1">
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Bookings
          </Link>
        </div>
        <h1 className="page-title">Edit Booking</h1>
        <p className="page-subtitle">
          Update your pending request — changes reset its approval status
        </p>
      </div>

      <BookingWizard mode="edit" initialBooking={booking} />
    </div>
  );
}