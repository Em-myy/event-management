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
  params: Promise<{ id: string }> | { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const resolvedParams = await params;

  const { data: booking, error } = await buildEditQuery(
    supabase,
    resolvedParams.id,
    user.id,
  );

  if (error) {
    console.error("SUPABASE ERROR:", error);
    return (
      <div className="p-4 sm:p-10 text-red-500 w-full">
        <h1 className="text-xl sm:text-2xl font-bold">Query Error!</h1>
        <pre className="mt-4 bg-red-50 p-3 sm:p-4 rounded-xl text-xs sm:text-sm overflow-auto">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  if (!booking) {
    redirect("/bookings");
  }

  if (booking.status !== "pending") {
    /* Approved / rejected bookings cannot be edited */
    redirect("/bookings");
  }

  return (
    <div className="animate-fade-in w-full">
      <div className="page-header mb-6 sm:mb-8 flex flex-col gap-1 sm:gap-2">
        <div className="flex items-center gap-3 mb-1 sm:mb-2">
          <Link
            href="/bookings"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            My Bookings
          </Link>
        </div>
        <h1 className="page-title text-2xl sm:text-3xl md:text-4xl wrap-break-word">
          Edit Booking
        </h1>
        <p className="page-subtitle text-sm sm:text-base wrap-break-word">
          Update your pending request — changes reset its approval status
        </p>
      </div>

      <BookingWizard mode="edit" initialBooking={booking} />
    </div>
  );
}
