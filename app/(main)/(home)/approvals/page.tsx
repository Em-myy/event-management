import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ApprovalsRealtimeList from "@/components/ApprovalsRealtimeList";
import { buildPendingQuery } from "@/utils/queries";

export const metadata = { title: "Approvals — ESRMS" };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role_id < 2) redirect("/dashboard");

  const { data: pending } = await buildPendingQuery(supabase);

  return (
    <div className="animate-fade-in w-full">
      <div className="page-header mb-6 sm:mb-8 flex flex-col gap-1 sm:gap-2">
        <h1 className="page-title text-2xl sm:text-3xl md:text-4xl wrap-break-word">
          Pending Approvals
        </h1>
        <p className="page-subtitle text-sm sm:text-base wrap-break-word">
          Review and action booking requests awaiting your decision
        </p>
      </div>

      <ApprovalsRealtimeList initialBookings={pending ?? []} />
    </div>
  );
}
